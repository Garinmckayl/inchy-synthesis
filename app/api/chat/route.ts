/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getGroupConfig } from "../../actions";
import { openai } from "@ai-sdk/openai";
// import { auth } from "../../(auth)/auth";
import CodeInterpreter from "@e2b/code-interpreter";

import { tavily } from "@tavily/core";
import {
  type CoreUserMessage,
  convertToCoreMessages,
  smoothStream,
  streamText,
  generateText,
  tool,
  createDataStreamResponse,
} from "ai";
import Exa from "exa-js";
import { z } from "zod";
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "../../../lib/utils";
// import { PrismaClient } from "@prisma/client";

// const session = await auth();

// const prisma = new PrismaClient();

// Allow streaming responses up to 30 seconds
export const maxDuration = 5;

function sanitizeUrl(url: string): string {
  return url.replace(/\s+/g, "%20");
}

async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return (
      response.ok &&
      (response.headers.get("content-type")?.startsWith("image/") ?? false)
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { messages, model, id } = await req.json();
  const group = "researcher";
  const { tools: activeTools, systemPrompt } = await getGroupConfig("chat");

  const result = streamText({
    model: openai("gpt-3.5-turbo"),
    messages: convertToCoreMessages(messages),
    system: systemPrompt,
    experimental_activeTools: [...activeTools],
    experimental_transform: smoothStream({
      chunking: "word",
      delayInMs: 15,
    }),
    temperature: 0,
    tools: {
      web_search: tool({
        description:
          "Search the web for information with multiple queries, max results and search depth.",
        parameters: z.object({
          queries: z.array(
            z
              .string()
              .describe(
                "Array of crypto related queries to look up on the web."
              )
          ),
          maxResults: z.array(
            z
              .number()
              .describe(
                "Array of maximum number of results to return per query."
              )
              .default(5)
          ),
          topics: z.array(
            z
              .enum(["general", "finance"])
              .describe("Array of topic types to search for.")
              .default("finance")
          ),
          searchDepth: z.array(
            z
              .enum(["basic", "advanced"])
              .describe("Array of search depths to use.")
              .default("basic")
          ),
          exclude_domains: z
            .array(z.string())
            .describe("A list of domains to exclude from all search results.")
            .default([]),
        }),
        execute: async ({
          queries,
          maxResults,
          topics,
          searchDepth,
          exclude_domains,
        }: {
          queries: string[];
          maxResults: number[];
          topics: ("finance" | "general")[];
          searchDepth: ("basic" | "advanced")[];
          exclude_domains?: string[];
        }) => {
          const apiKey = process.env.TAVILY_API_KEY;
          const tvly = tavily({ apiKey });
          const includeImageDescriptions = true;

          console.log("Queries:", queries);
          console.log("Max Results:", maxResults);
          console.log("Topics:", topics);
          console.log("Search Depths:", searchDepth);
          console.log("Exclude Domains:", exclude_domains);

          // Execute searches in parallel
          const searchPromises = queries.map(async (query, index) => {
            const data = await tvly.search(query, {
              topic: topics[index] || topics[0] || "finance",
              days: topics[index] === "finance" ? 7 : undefined,
              maxResults: maxResults[index] || maxResults[0] || 5,
              searchDepth: searchDepth[index] || searchDepth[0] || "basic",
              includeAnswer: true,
              includeImages: true,
              includeImageDescriptions: includeImageDescriptions,
              excludeDomains: exclude_domains,
            });
            console.log("data", data);
            return {
              query,
              results: data.results.map((obj: any) => ({
                url: obj.url,
                title: obj.title,
                content: obj.content,
                raw_content: obj.raw_content,
                published_date:
                  topics[index] === "finance" ? obj.published_date : undefined,
              })),

              images: includeImageDescriptions
                ? await Promise.all(
                    data.images.map(
                      async ({
                        url,
                        description,
                      }: {
                        url: string;
                        description?: string;
                      }) => {
                        const sanitizedUrl = sanitizeUrl(url);
                        const isValid = await isValidImageUrl(sanitizedUrl);

                        return isValid
                          ? {
                              url: sanitizedUrl,
                              description: description ?? "",
                            }
                          : null;
                      }
                    )
                  ).then((results) =>
                    results.filter(
                      (
                        image
                      ): image is {
                        url: string;
                        description: string;
                      } =>
                        image !== null &&
                        typeof image === "object" &&
                        typeof image.description === "string" &&
                        image.description !== ""
                    )
                  )
                : await Promise.all(
                    data.images.map(async ({ url }: { url: string }) => {
                      const sanitizedUrl = sanitizeUrl(url);
                      return (await isValidImageUrl(sanitizedUrl))
                        ? sanitizedUrl
                        : null;
                    })
                  ).then((results) =>
                    results.filter((url): url is string => url !== null)
                  ),
            };
          });

          const searchResults = await Promise.all(searchPromises);
          console.log(searchResults, "search result");

          return {
            searches: searchResults,
          };
        },
      }),
      stock_chart: tool({
        description:
          "Write and execute Python code to find stock data and generate a stock chart.",
        parameters: z.object({
          title: z.string().describe("The title of the chart."),
          code: z.string().describe("The Python code to execute."),
          icon: z
            .enum(["stock", "date", "calculation", "default"])
            .describe("The icon to display for the chart."),
        }),
        execute: async ({
          code,
          title,
          icon,
        }: {
          code: string;
          title: string;
          icon: string;
        }) => {
          console.log("Code:", code);
          console.log("Title:", title);
          console.log("Icon:", icon);

          const sandbox = await CodeInterpreter.create(
            process.env.SANDBOX_TEMPLATE_ID!
          );
          const execution = await sandbox.runCode(code);
          let message = "";

          if (execution.results.length > 0) {
            for (const result of execution.results) {
              if (result.isMainResult) {
                message += `${result.text}\n`;
              } else {
                message += `${result.text}\n`;
              }
            }
          }

          if (
            execution.logs.stdout.length > 0 ||
            execution.logs.stderr.length > 0
          ) {
            if (execution.logs.stdout.length > 0) {
              message += `${execution.logs.stdout.join("\n")}\n`;
            }
            if (execution.logs.stderr.length > 0) {
              message += `${execution.logs.stderr.join("\n")}\n`;
            }
          }

          if (execution.error) {
            message += `Error: ${execution.error}\n`;
            console.log("Error: ", execution.error);
          }

          console.log(execution.results);
          if (execution.results[0].chart) {
            execution.results[0].chart.elements.map((element: any) => {
              console.log(element.points);
            });
          }

          return {
            message: message.trim(),
            chart: execution.results[0].chart ?? "",
          };
        },
      }),
      crypto_chart: tool({
        description:
          "Write and execute Python code to find crypto data and generate a crypto chart.",
        parameters: z.object({
          title: z.string().describe("The title of the chart."),
          code: z.string().describe("The Python code to execute."),
          icon: z
            .enum(["crypto", "date", "calculation", "default"])
            .describe("The icon to display for the chart."),
        }),
        execute: async ({
          code,
          title,
          icon,
        }: {
          code: string;
          title: string;
          icon: string;
        }) => {
          console.log("Code:", code);
          console.log("Title:", title);
          console.log("Icon:", icon);

          const sandbox = await CodeInterpreter.create(
            process.env.SANDBOX_TEMPLATE_ID!
          );
          const execution = await sandbox.runCode(code);
          let message = "";

          if (execution.results.length > 0) {
            for (const result of execution.results) {
              if (result.isMainResult) {
                message += `${result.text}\n`;
              } else {
                message += `${result.text}\n`;
              }
            }
          }

          if (
            execution.logs.stdout.length > 0 ||
            execution.logs.stderr.length > 0
          ) {
            if (execution.logs.stdout.length > 0) {
              message += `${execution.logs.stdout.join("\n")}\n`;
            }
            if (execution.logs.stderr.length > 0) {
              message += `${execution.logs.stderr.join("\n")}\n`;
            }
          }

          if (execution.error) {
            message += `Error: ${execution.error}\n`;
            console.log("Error: ", execution.error);
          }

          console.log(execution.results);
          if (execution.results[0].chart) {
            execution.results[0].chart.elements.map((element: any) => {
              console.log(element.points);
            });
          }

          return {
            message: message.trim(),
            chart: execution.results[0].chart ?? "",
          };
        },
      }),

      // crypto_search: tool({
      //   description: "Search local laws and regulations.",
      //   parameters: z.object({
      //     query: z.string().describe("The search query"),
      //   }),
      //   execute: async ({ query }: { query: string }) => {
      //     try {
      //       const exa = new Exa(process.env.EXA_API_KEY as string);

      //       // Search academic papers with content summary
      //       const result = await exa.searchAndContents(query, {
      //         type: "auto",
      //         numResults: 5,
      //         category: "legal and policy sources	",
      //         summary: {
      //           query: "summary of the sources",
      //         },
      //       });

      //       // Process and clean results
      //       const processedResults = result.results.reduce<
      //         typeof result.results
      //       >((acc, paper) => {
      //         // Skip if URL already exists or if no summary available
      //         if (acc.some((p) => p.url === paper.url) || !paper.summary)
      //           return acc;

      //         // Clean up summary (remove "Summary:" prefix if exists)
      //         const cleanSummary = paper.summary.replace(/^Summary:\s*/i, "");

      //         // Clean up title (remove [...] suffixes)
      //         const cleanTitle = paper.title?.replace(/\s\[.*?\]$/, "");

      //         acc.push({
      //           ...paper,
      //           title: cleanTitle || "",
      //           summary: cleanSummary,
      //         });

      //         return acc;
      //       }, []);

      //       // Take only the first 10 unique, valid results
      //       const limitedResults = processedResults.slice(0, 5);

      //       return {
      //         results: limitedResults,
      //       };
      //     } catch (error) {
      //       console.error("legal search error:", error);
      //       throw error;
      //     }
      //   },
      // }),
    },
    onFinish: async ({ response }) => {
      try {
        const responseMessagesWithoutIncompleteToolCalls =
          sanitizeResponseMessages(response.messages);

        // await saveMessages({
        //   messages: responseMessagesWithoutIncompleteToolCalls.map(
        //     (message) => {
        //       const messageId = generateUUID();

        //       // if (message.role === "assistant") {
        //       //   dataStream.writeMessageAnnotation({
        //       //     messageIdFromServer: messageId,
        //       //   });
        //       // }

        //       return {
        //         id: messageId,
        //         chatId: id,
        //         role: message.role,
        //         content: message.content,
        //         createdAt: new Date(),
        //       };
        //     }
        //   ),
        // });
      } catch (error) {
        console.error("Failed to save chat");
      }
    },
  });
  const userMessageId = generateUUID();
  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  // const chat = await getChatById({ id });

  // if (!chat) {
  //   const title = await generateTitleFromUserMessage({ message: userMessage });
  //   // await saveChat({ id, userId: "cm5wlwpzc00000ny6a9frdrvw", title });
  // }

  // await saveMessages({
  //   messages: [
  //     { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
  //   ],
  // });

  return result.toDataStreamResponse();
}

// export async function saveMessages({ messages }: { messages }) {
//   try {
//     // Use Prisma's createMany method to insert multiple messages
//     return await prisma.message.createMany({
//       data: messages,
//     });
//   } catch (error) {
//     console.error("Failed to save messages in database", error);
//     throw error;
//   } finally {
//     await prisma.$disconnect(); // Ensure the Prisma client is disconnected after the operation
//   }
// }

// export async function getChatById({ id }: { id: string }) {
//   try {
//     const selectedChat = await prisma.chat.findUnique({
//       where: {
//         id: id, // Assuming 'id' is the primary key in the Chat model
//       },
//     });
//     return selectedChat;
//   } catch (error) {
//     console.error("Failed to get chat by id from database", error);
//     throw error;
//   } finally {
//     await prisma.$disconnect(); // Ensure the Prisma client is disconnected after the operation
//   }
// }

// export async function saveChat({
//   id,
//   userId,
//   title,
// }: {
//   id: string;
//   userId: string;
//   title: string;
// }) {
//   try {
//     return await prisma.chat.create({
//       data: {
//         id,
//         createdAt: new Date(), // Ensure your Chat model has a createdAt field
//         userId,
//         title,
//         chatType: "researcher",
//       },
//     });
//   } catch (error) {
//     console.error("Failed to save chat in database", error);
//     throw error;
//   } finally {
//     await prisma.$disconnect(); // Ensure the Prisma client is disconnected after the operation
//   }
// }

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const { text: title } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}
