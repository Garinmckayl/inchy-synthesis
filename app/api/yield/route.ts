// pages/api/recommend-strategy.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google'; // Or openai
import { fetchProtocolYields, ProtocolYield, calculateNetApy, getEthPrice } from '@/core/defi/protocols';
import { getAuthenticatedUser } from '@/lib/auth'; // Your auth helper
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const recommendRequestSchema = z.object({
  riskLevel: z.number().min(1).max(5),
  // Optional: Add current assets/strategy if needed for more context
  // currentStrategyProtocol: z.string().optional(),
});

const strategyRecommendationSchema = z.object({
    recommendedProtocol: z.enum(['Aave', 'Lido', 'EigenLayer', 'None'])
        .describe("The single best protocol recommended for yielding ETH based on input criteria."),
    reasoning: z.string()
        .describe("Detailed explanation for the recommendation, considering APY, risk, TVL, gas costs (net APY), and user's risk preference."),
    estimatedNetAPY: z.number()
        .describe("Estimated APY after factoring in estimated annualized gas costs for potential rebalancing (e.g., 4 times a year based on $10k deposit)."),
    confidenceScore: z.number().min(0).max(100)
        .describe("AI's confidence level (0-100) in this recommendation being optimal."),
    warnings: z.array(z.string())
        .describe("List of potential risks associated with the recommended protocol/strategy (e.g., smart contract risk, impermanent loss if applicable, slashing risk for staking)."),
    alternativeProtocols: z.array(z.object({
        protocol: z.string(),
        reasonNotRecommended: z.string().describe("Brief reason why this alternative wasn't the top pick (e.g., lower net APY, higher risk than preference).")
    })).optional().describe("Other protocols considered and why they weren't the primary recommendation."),
     // Include the strategy object for easy execution later
     strategyDetails: z.custom<ProtocolYield | null>(
        (val) => typeof val === 'object', // Basic check, zod can't easily validate complex external types perfectly here
        "Must be a ProtocolYield object or null"
      ).nullable().describe("Full details of the recommended protocol yield object, or null if recommendation is 'None'.")
});


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  // 1. Authenticate User
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 2. Validate Input
  const parseResult = recommendRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid request body', errors: parseResult.error.errors });
  }
  const { riskLevel } = parseResult.data;

  try {
    // 3. Fetch Fresh Data (or use cached within fetchProtocolYields)
    const [protocolData, ethPrice] = await Promise.all([
        fetchProtocolYields(),
        getEthPrice()
    ]);

    if (!protocolData.yields || protocolData.yields.length === 0) {
        return res.status(500).json({ message: 'Could not fetch protocol data for recommendation.' });
    }

    // 4. Prepare data for AI (calculate net APY)
    const protocolsWithNetApy = protocolData.yields.map(p => ({
        ...p,
        netApy: calculateNetApy(p, protocolData.gasPriceGwei, ethPrice, 4) // Assume 4 rebalances/yr
    }));

    // 5. Construct Prompt
    const prompt = `
      You are an expert DeFi yield strategist AI for the Inchy AI platform. Your goal is to recommend the *single best* protocol for a user to deposit ETH for yield generation based on their risk tolerance and current market conditions.

      User Context:
      - User ID: ${user.id}
      - Risk Tolerance Level: ${riskLevel} (1 = Very Conservative, 2 = Conservative, 3 = Moderate, 4 = Aggressive, 5 = Very Aggressive)

      Market & Protocol Data:
      - Current ETH Price: $${ethPrice.toFixed(2)} USD
      - Current Ethereum Gas Price: ${protocolData.gasPriceGwei.toFixed(2)} Gwei
      - Available Protocols for ETH Yield:
      ${JSON.stringify(protocolsWithNetApy.map(p => ({ // Select relevant fields for the prompt
          protocol: p.protocol,
          grossApy: p.apy,
          estimatedNetApy: p.netApy, // Pass the calculated net APY
          tvl_usd: p.tvl,
          riskLabel: p.riskLevel, // Use the predefined risk label
          estimatedGasForDeposit: p.gasEstimate
      })), null, 2)}

      Instructions:
      1.  **Analyze Risk:** Strictly adhere to the user's risk tolerance.
          *   Level 1-2 (Conservative): Strongly prefer 'Low' risk protocols. Only consider 'Medium' if net yield is significantly higher AND clearly state the risk increase. Avoid 'High'.
          *   Level 3 (Moderate): Prefer 'Low' and 'Medium'. Can consider 'High' if net yield is substantially higher, but emphasize the risk.
          *   Level 4-5 (Aggressive): Can consider 'Medium' and 'High' risk protocols for maximum net yield, but still prefer lower risk if yields are comparable. Always highlight the risks involved.
      2.  **Prioritize Net Yield:** Compare the 'estimatedNetApy' after accounting for gas costs. Higher is generally better *within the allowed risk level*.
      3.  **Consider TVL:** Higher TVL generally indicates greater stability and lower risk. Use it as a secondary factor, especially when comparing protocols with similar net APY and risk labels.
      4.  **Select ONE Protocol:** Choose the single best option. If *no* protocol offers a positive net APY or fits the risk profile, recommend 'None'.
      5.  **Provide Clear Reasoning:** Justify your choice by comparing the recommended protocol to the others based on net APY, risk level, TVL, and gas efficiency relative to the user's risk tolerance.
      6.  **Include Warnings:** List specific, actionable risks (e.g., "Aave carries smart contract risk and potential liquidation risk if used for borrowing", "Lido stETH could depeg slightly from ETH", "EigenLayer restaking involves slashing risk and platform risk").
      7.  **Fill Strategy Details:** If recommending a protocol, include the full corresponding 'ProtocolYield' object in the 'strategyDetails' field. If recommending 'None', set 'strategyDetails' to null.

      Respond *only* with a valid JSON object matching the provided schema.
    `;

    // 6. Call AI Model
    const { object: recommendation } = await generateObject({
      model: google('gemini-1.5-flash-latest'), // Use a capable model
      schema: strategyRecommendationSchema,
      prompt: prompt,
      mode: 'json' // Ensure JSON output mode
    });

    // 7. Return Recommendation
    return res.status(200).json(recommendation);

  } catch (error) {
    console.error('API Error recommending strategy:', error);
    // Check if it's an AI SDK error
     if (error.message.includes('fetch failed') || error.message.includes('API key')) {
        return res.status(502).json({ message: 'Failed to communicate with AI model or external API.', details: error.message });
    }
    return res.status(500).json({ message: 'Failed to generate strategy recommendation', error: error.message });
  }
}