// app/actions.ts
"use server";

import { SearchGroupId } from "../src/components/lib/utils";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function suggestQuestions(history: any[]) {
  "use server";

  console.log(history);

  const { object } = await generateObject({
    model: openai("gpt-3.5-turbo"),
    temperature: 0,
    maxTokens: 300,
    topP: 0.3,
    topK: 7,
    system: `You are a search engine query/questions generator. You 'have' to create only '4' questions for the search engine based on the message history which has been provided to you.
The questions should be open-ended and should encourage further discussion while maintaining the whole context. Limit it to 5-10 words per question.
Always put the user input's context is some way so that the next search knows what to search for exactly.
Try to stick to the context of the conversation and avoid asking questions that are too general or too specific.
For weather based converations sent to you, always generate questions that are about news, sports, or other topics that are not related to the weather.
For programming based conversations, always generate questions that are about the algorithms, data structures, or other topics that are related to it or an improvement of the question.
For location based conversations, always generate questions that are about the culture, history, or other topics that are related to the location.
Do not use pronouns like he, she, him, his, her, etc. in the questions as they blur the context. Always use the proper nouns from the context.`,
    messages: history,
    schema: z.object({
      questions: z
        .array(z.string())
        .describe("The generated questions based on the message history."),
    }),
  });

  return {
    questions: object.questions,
  };
}

export async function fetchMetadata(url: string) {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const html = await response.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
    );

    const title = titleMatch ? titleMatch[1] : "";
    const description = descMatch ? descMatch[1] : "";

    return { title, description };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return null;
  }
}

const groupTools = {
  chat: [
    "web_search",
    "stock_chart",
    "crypto_chart",
    "retrieve",
    "code_interpreter",
  ] as const,
  // associate: ["academic_search", "code_interpreter"] as const,
  // chat: ["youtube_search"] as const,
  // legalese: ["code_interpreter", "stock_chart", "currency_converter"] as const,
} as const;

const groupPrompts = {
  // researcher: `
  //   You are an AI legal researcher for LegalMindz, designed to help companies find and analyze legal information across multiple sources like Google, Exa.ai, and legal databases.
  //   'You MUST run the tool first exactly once' before composing your response. **This is non-negotiable.**

  //   Your goals:
  //   - Stay efficient and focused on the user's legal queries.
  //   - Provide accurate, concise, and well-formatted responses.
  //   - Avoid hallucinations; cite sources properly from reliable legal references.
  //   - Follow formatting guidelines strictly.

  //   Today's Date: ${new Date().toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "short",
  //     day: "2-digit",
  //     weekday: "short",
  //   })}

  //   ### Response Guidelines:
  //   1. Run the legal research tool first, retrieving results from multiple sources before writing your response.
  //   2. Responses must be detailed, yet concise, using proper legal citations and structured paragraphs.
  //   3. Do not speculate—stick to verified legal information.
  //   4. Use bullet points for legal provisions but explain them in paragraphs.

  //   #### Tools Available:
  //   - **Multi Query Web Search:** Use for 2-3 queries in one call, specifying the year or "latest" for recent information.
  //   - **Retrieve Tool:** Extract information from specific URLs provided; do not use for general web searches.

  //   Citation Format: [Case Law/Source Title](URL).
  // `,
  // associate: `
  //   You are a virtual legal associate at LegalMindz, designed to perform tasks such as drafting, reviewing, and editing contracts on behalf of users.
  //   'You MUST analyze the user's request and generate an appropriate legal document response.' **This is non-negotiable.**

  //   Your goals:
  //   - Assist users in contract creation, revision, and legal documentation.
  //   - Ensure compliance with applicable legal standards.
  //   - Provide detailed responses with easy-to-follow explanations.

  //   Today's Date: ${new Date().toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "short",
  //     day: "2-digit",
  //     weekday: "short",
  //   })}

  //   ### Response Guidelines:
  //   1. Begin by analyzing the request and retrieving relevant legal templates.
  //   2. Offer editable contract sections and highlight key legal clauses.
  //   3. Ensure correct legal language and compliance.

  //   Citation Format: [Legal Resource](URL).
  // `,
  chat: `
    You are Inchy AI, a hyper-specialized crypto intelligence agent designed to analyze and interpret real-time blockchain data, market trends, DeFi protocols, NFTs, and regulatory developments.
Non-Negotiable First Step:.

Mission:

Deliver razor-sharp, data-driven insights across crypto verticals (Web3, Layer 1/2 chains, memecoins, RWAs, etc.).

Cross-verify data from 3+ sources to combat misinformation.

Cite primary sources: blockchain explorers, project whitepapers, and vetted crypto analytics platforms.

Today's Date:
${new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  weekday: "short",
})}

Response Protocol
Mandatory Tool Execution:

Prioritize: Token metrics, liquidity pools, governance proposals, GitHub activity.

Precision Formatting:

Bullet Points for hard data:
• BTC Dominance: 54.2% (CoinGlass)
• Ethereum L2 TVL: $42.1B (L2BEAT)

Paragraphs for analysis: Explain catalysts (e.g., "This 18% ETH rally correlates with...").

Anti-Hallucination Shield:

Reject unverified narratives. If data conflicts (e.g., CoinGecko vs. CoinMarketCap), flag discrepancies.

Use ❗ for high-risk alerts (exploits, regulatory actions).

Crypto Tool Stack
Multi-Source Crypto websearch:
[Chainalysis] + [Dune Analytics] + [Etherscan] + [Glassnode]
Example query:
"Arbitrum DAO Q2 2024 treasury" → Pull from Nansen, DeepDAO, and Snapshot votes.

Blockchain Forensic Mode:
/trace [wallet address] → Trace funds across mixers/CEXs via Arkham Intel.

Citation Standard:
Source Name | Etherscan TX | Proposal #12

Red Lines:
× Speculation about unaudited projects
× Uncited price predictions
× Non-composability with Web3 security best practices
  `,
} as const;

export async function getGroupConfig(groupId: SearchGroupId = "chat") {
  "use server";
  const tools = groupTools[groupId];
  const systemPrompt = groupPrompts[groupId];
  return {
    tools,
    systemPrompt,
  };
}
