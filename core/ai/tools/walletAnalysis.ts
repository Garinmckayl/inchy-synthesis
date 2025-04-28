// core/ai/tools/walletAnalysis.ts
import { tool } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import prisma from '@/lib/prisma';
// Import the updated service function and the result type
import { fetchComprehensiveWalletData, WalletDataResult } from '@/core/portfolio/portfolioService';

const walletAnalysisSchema = z.object({ /* ... same schema ... */ });
type WalletAnalysisResult = z.infer<typeof walletAnalysisSchema>;

export const walletAnalysisTool = tool({
    description: "Analyzes a specific crypto wallet address using Zapper (primary) or Ethplorer (fallback) data to provide insights on holdings, DeFi positions (if available), portfolio health, distribution, risks, and opportunities.",
    parameters: z.object({ /* ... address, networks, forceRefresh ... */ }),
    execute: async ({ address, networks = ['ethereum'], forceRefresh }, { userId }: { userId?: string } = {}) => {
        if (!userId) { /* ... error handling ... */ }
        console.log(`[WalletAnalysis Tool] Starting analysis for address: ${address} on ${networks.join(',')}. User: ${userId}. Force Refresh: ${forceRefresh}`);

        try {
            // 1. Check Cache (Adjust key logic if needed)
            const cacheKey = { address, network: networks.join('_') };
            if (!forceRefresh) {
                const existingAnalysis = await prisma.walletAnalysis.findUnique({ /* ... */ });
                if (existingAnalysis?.analysis) {
                    // Optional: Check if cached data is from Zapper or Ethplorer if that matters for returning cache
                    console.log(`[WalletAnalysis Tool] Returning cached analysis for ${address}`);
                    const parsedAnalysis = existingAnalysis.analysis as WalletAnalysisResult;
                    return { analysisSummary: { /* return summary */ } };
                }
            }

            // 2. Fetch Data using the service (handles fallback internally)
            console.log(`[WalletAnalysis Tool] Fetching wallet data via service for ${address}...`);
            const walletDataResult: WalletDataResult = await fetchComprehensiveWalletData(address, networks);

            // Handle complete fetch failure
            if (walletDataResult.dataSource === 'Error') {
                console.error(`[WalletAnalysis Tool] Failed fetching data for ${address}: ${walletDataResult.error}`);
                return { error: walletDataResult.error || "Failed to fetch wallet data." };
            }
            console.log(`[WalletAnalysis Tool] Data fetched via service for ${address}. Source: ${walletDataResult.dataSource}. Generating AI analysis...`);


            // 3. Construct AI Prompt based on Data Source
            let prompt = `Analyze this wallet based on the provided data. Address: ${address}. Network(s): ${networks.join(',')}.\n`;
            prompt += `Data Source: ${walletDataResult.dataSource}.\n`;

            if (walletDataResult.dataSource === 'Zapper') {
                prompt += `The data includes token balances and detailed DeFi positions. Provide a comprehensive analysis covering portfolio health, distribution, concentration risks, yield opportunities suggested by current DeFi positions, and general security considerations.\n`;
            } else { // Ethplorer
                prompt += `The data PRIMARILY includes token balances (DeFi positions are NOT available from this source). Focus your analysis on token distribution, risks associated with specific tokens held, and potential opportunities based on these holdings. Acknowledge the lack of DeFi visibility.\n`;
            }
            prompt += `Wallet Data: ${JSON.stringify(walletDataResult, null, 2)}\n\nFormat response according to schema...`;


            // 4. Generate Analysis using AI
            const { object: analysis } = await generateObject({
                model: google('gemini-1.5-flash-latest'),
                schema: walletAnalysisSchema,
                prompt: prompt, // Use the adjusted prompt
            });

            // 5. Deeper Security Scan (optional)
            if (analysis.securityScore < 50) { /* ... same logic ... */ }

            // 6. Save/Update Analysis in Database
            // Only save if the analysis was successful (don't save errors)
            const savedAnalysis = await prisma.walletAnalysis.upsert({
                where: { address_network: cacheKey },
                update: { analysis: analysis as any, dataSource: walletDataResult.dataSource, updatedAt: new Date() }, // Add dataSource to DB schema?
                create: { userId: userId, address: cacheKey.address, network: cacheKey.network, analysis: analysis as any, dataSource: walletDataResult.dataSource }, // Add dataSource to DB schema?
            });
            console.log(`[WalletAnalysis Tool] Analysis generated (source: ${walletDataResult.dataSource}) and saved for ${address}.`);

            // 7. Return Summary
             return { analysisSummary: { /* return summary structure */ } };

        } catch (error: any) {
            console.error(`[WalletAnalysis Tool] Error during analysis process for ${address}:`, error);
            return { error: `Analysis process failed: ${error.message}` };
        }
    },
});

// --- Ensure you have getUrlString in lib/externalApiUtils.ts ---
// export const getUrlString = (key: string, operation: string, walletAddress: string) => { ... };