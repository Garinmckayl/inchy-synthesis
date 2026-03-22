import { tool } from 'ai';
import { z } from 'zod';
import { tavily } from "@tavily/core";
import { sanitizeUrl, isValidImageUrl } from '@/lib/utils'; // Assume these helpers exist

const apiKey = process.env.TAVILY_API_KEY;
if (!apiKey) {
    console.warn("TAVILY_API_KEY is not set. Web search tool will not work.");
}
const tvly = new tavily({ apiKey });

export const webSearchTool = tool({
    description: "Search the web for recent information about crypto protocols, tokens, market sentiment, or specific events. Use specific, targeted queries.",
    parameters: z.object({
        queries: z.array(z.string().describe("Specific queries related to crypto finance, news, or protocols.")).describe("Array of queries to search."),
        // Simplified parameters for this context, assuming default maxResults, topics etc. are sufficient for now
        // You can add back maxResults, topics, searchDepth arrays if needed for fine-grained control per query
         maxResultsPerQuery: z.number().optional().default(3).describe("Max results per query."),
         searchDepth: z.enum(["basic", "advanced"]).default("basic").describe("Search depth."),
         exclude_domains: z.array(z.string()).optional().default([]).describe("Domains to exclude."),
    }),
    execute: async ({ queries, maxResultsPerQuery, searchDepth, exclude_domains }) => {
        if (!apiKey) throw new Error("Tavily API key not configured.");

        console.log(`[WebSearch Tool] Executing queries: ${queries.join(', ')}`);

        const searchPromises = queries.map(async (query) => {
            try {
                 const data = await tvly.search(query, {
                    topic: "finance", // Focus on finance for this context
                    maxResults: maxResultsPerQuery,
                    searchDepth: searchDepth,
                    includeAnswer: true, // Get Tavily's summarized answer
                    includeRawContent: false, // Maybe skip raw content unless needed
                    includeImages: false, // Skip images for pure text analysis
                    excludeDomains: exclude_domains,
                });

                // Return a concise summary of results for the AI
                return {
                    query: query,
                    answer: data.answer || "No direct answer found.",
                    resultsSummary: data.results.map((res: any) => ({
                        title: res.title,
                        url: res.url,
                        snippet: res.content, // Use 'content' which is often a snippet/summary
                    }))
                };
            } catch (error: any) {
                 console.error(`[WebSearch Tool] Error searching for "${query}":`, error);
                 return { query: query, error: `Failed to search: ${error.message}` };
            }

        });

        const searchResults = await Promise.all(searchPromises);
        console.log(`[WebSearch Tool] Results:`, JSON.stringify(searchResults).substring(0, 500) + "..."); // Log snippet

        // Structure the final output for the AI
        return { searchResults };
    },
});