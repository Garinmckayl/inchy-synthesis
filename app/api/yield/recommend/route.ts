// src/app/api/yield/recommend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { fetchProtocolYields, calculateNetApy, getEthPrice, ProtocolYield } from '@/core/defi/protocols';
import { getPrivyUser, getPrimaryWalletAddress } from '@/lib/auth';
import { tools, AppTools } from '@/core/ai/tools';


// export const runtime = 'edge';
// export const preferredRegion = ['iad1'];

const recommendRequestSchema = z.object({
  riskLevel: z.number().min(1).max(5),
  investmentAmount: z.number().min(0).default(10000),
  timeHorizon: z.number().min(1).default(12)
});

const strategyRecommendationSchema = z.object({
    recommendedProtocol: z.enum(['Aave', 'Lido', 'EigenLayer', 'Curve Finance', 'Compound', 'None'])
        .describe("The single best protocol recommended for yielding ETH based on input criteria."),
    reasoning: z.string()
        .describe("Detailed explanation for the recommendation, considering APY, risk, TVL, gas costs (net APY), user's risk preference, AND insights from any tools used (web search, wallet analysis)."),
    estimatedNetAPY: z.number()
        .describe("Estimated APY after factoring in estimated annualized gas costs for potential rebalancing (e.g., 4 times a year based on $10k deposit)."),
    confidenceScore: z.number().min(0).max(100)
        .describe("AI's confidence level (0-100) in this recommendation being optimal."),
    warnings: z.array(z.string())
        .describe("List of potential risks associated with the recommended protocol/strategy (e.g., smart contract risk, impermanent loss if applicable, slashing risk for staking). Include risks identified by tools."),
    alternativeProtocols: z.array(z.object({
        protocol: z.string(),
        reasonNotRecommended: z.string().describe("Brief reason why this alternative wasn't the top pick (e.g., lower net APY, higher risk than preference).")
    })).optional().describe("Other protocols considered and why they weren't the primary recommendation."),
    strategyDetails: z.object({
        protocol: z.string(),
        apy: z.number(),
        tvl: z.number(),
        riskLevel: z.string(),
        token: z.string(),
        gasEstimate: z.number(),
        netApy: z.number().optional()
    }).nullable().describe("Full details of the recommended protocol yield object, or null if recommendation is 'None'.")
});

export async function POST(req: NextRequest) {
  try {
    // Parse input with defaults
    const jsonBody = await req.json();
    const parseResult = recommendRequestSchema.safeParse(jsonBody);
    if (!parseResult.success) {
      return NextResponse.json({ message: 'Invalid request body', errors: parseResult.error.errors }, { status: 400 });
    }
    const { riskLevel, investmentAmount, timeHorizon } = parseResult.data;

    // Try to get user but don't fail if not available
    let user = null;
    try {
      user = await getPrivyUser();
    } catch (error) {
      console.log('No user authenticated, proceeding without user info');
    }
    const userWalletAddress = user ? getPrimaryWalletAddress(user) : null;

    // Fetch Market Data
    const [protocolData, ethPrice] = await Promise.all([
      fetchProtocolYields(),
      getEthPrice()
    ]);

    if (!protocolData.yields || protocolData.yields.length === 0) {
      return NextResponse.json({ message: 'Could not fetch protocol data for recommendation.' }, { status: 500 });
    }

    const protocolsWithNetApy = protocolData.yields.map(p => ({
      ...p,
      netApy: calculateNetApy(p, protocolData.gasPriceGwei, ethPrice, 4)
    }));

    // 4. Construct Prompt with Tool Guidance
    const prompt = `
      You are Inchy AI, an expert autonomous financial agent. Your goal is to recommend the *single best* DeFi protocol for a user to deposit ETH for yield, considering their risk tolerance, current market conditions, and potentially their existing portfolio state or recent news.

      User Context:
      - User ID: ${user?.id}
      - Risk Tolerance Level: ${riskLevel} (1=Very Conservative, 5=Very Aggressive)
      - Investment Amount: ${investmentAmount}
      - Time Horizon: ${timeHorizon}
      - User Wallet Address (for analysis): ${userWalletAddress || 'Not Provided'}

      Market & Protocol Data:
      - Current ETH Price: $${ethPrice.toFixed(2)} USD
      - Current Ethereum Gas Price: ${protocolData.gasPriceGwei.toFixed(2)} Gwei
      - Available Protocols for ETH Yield (Base Data):
      ${JSON.stringify(protocolsWithNetApy.map(p => ({
        protocol: p.protocol,
        apy: p.apy,
        tvl: p.tvl,
        riskLevel: p.riskLevel,
        token: p.token,
        gasEstimate: p.gasEstimate,
        netApy: p.netApy
      })), null, 2)}

      Available Tools:
      - 'web_search': Use this to check for *very recent* (< 1-2 days) security alerts, major announcements, or sudden market sentiment shifts regarding a specific protocol (e.g., Aave, Lido, EigenLayer) IF its yield seems unusually high/low or if base data looks suspicious. Be specific in your queries.
      - 'wallet_analysis': If a user wallet address is provided (${userWalletAddress ? 'Yes' : 'No'}), use this tool ONCE to understand the user's current portfolio allocation (e.g., heavy concentration in one asset/protocol) and recent DeFi activity. This context helps tailor the recommendation for diversification or synergy. Do NOT use if no address is available.

      Instructions:
      1.  **Assess Need for Tools:** Briefly review the base protocol data and user context. Decide if calling web_search (for protocol concerns) or wallet_analysis (if address available) is necessary to make a well-informed decision. Do not overuse tools.
      2.  **Call Tools (If Needed):** If you decide to use tools, call them with specific parameters.
      3.  **Synthesize Information:** Combine the base market data (APY, TVL, Risk, Net APY) with insights from any tools used (e.g., recent negative news from web_search, high user concentration from wallet_analysis).
      4.  **Apply Core Logic:**
          *   Strictly adhere to the user's risk tolerance level (Levels 1-2 prefer Low risk, 3 allows Medium, 4-5 allow High risk with justification).
          *   Prioritize the highest 'estimatedNetApy' *within the acceptable risk category*.
          *   Use TVL as a secondary factor for stability.
          *   Consider wallet analysis insights (e.g., suggest diversification if user is over-concentrated, even if the concentrated asset has high yield).
      5.  **Select ONE Protocol or 'None':** Choose the single best option. Recommend 'None' if no suitable option exists (e.g., negative net APY, extreme risks identified by tools, unacceptable risk level).
      6.  **Provide Clear Reasoning:** Explain your choice, explicitly mentioning how base data AND tool insights (if used) influenced the decision.
      7.  **Include Warnings:** List specific risks, including any highlighted by tool results.
      8.  **Fill Strategy Details:** Include the full 'ProtocolYield' object for the recommended protocol, or null if 'None'.

      Respond *only* with a valid JSON object matching the provided schema.
    `;

    // 5. Call AI Model with Tools
    const { object: recommendation } = await generateObject({
      model: google('gemini-1.5-flash-latest'),
      tools: tools as AppTools,
      schema: strategyRecommendationSchema,
      prompt: prompt,
      mode: 'json'
    });

    // 6. Return Recommendation
    return NextResponse.json(recommendation);

  } catch (error: any) {
    console.error('API Error recommending strategy:', error);
    if (error.message.includes('fetch failed') || error.message.includes('API key')) {
      return NextResponse.json({ message: 'Failed to communicate with AI model or external API.', details: error.message }, { status: 502 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to generate strategy recommendation', error: error.message }, { status: 500 });
  }
}