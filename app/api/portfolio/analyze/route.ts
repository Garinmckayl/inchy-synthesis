import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import prisma from '@/lib/prisma';
import { getPrivyUser } from '@/lib/privy';

// Remove edge runtime since we're using Prisma which doesn't support edge
// export const runtime = 'edge';

// Define the analysis schema
const walletAnalysisSchema = z.object({
  healthScore: z.number().min(0).max(100),
  portfolioDistribution: z.object({
    description: z.string(),
    risks: z.array(z.string()),
    opportunities: z.array(z.string())
  }),
  gasAnalysis: z.object({
    monthlySpending: z.string(),
    efficiency: z.number().min(0).max(100),
    recommendations: z.array(z.string())
  }),
  securityScore: z.number().min(0).max(100),
  recommendations: z.array(z.object({
    type: z.enum(['security', 'portfolio', 'gas', 'general']),
    priority: z.number().min(1).max(5),
    suggestion: z.string(),
    reasoning: z.string()
  }))
});

export async function POST(req: Request) {
  try {
    // Get the authenticated user from Privy
    const user = await getPrivyUser();
    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { walletData, address, network, forceRefresh = false } = await req.json();

    // Check for existing analysis if not forcing refresh
    if (!forceRefresh) {
      const existingAnalysis = await prisma.walletAnalysis.findUnique({
        where: {
          address_network: {
            address,
            network
          }
        }
      });

      if (existingAnalysis) {
        return Response.json(existingAnalysis.analysis);
      }
    }

    // Generate new analysis
    const { object: analysis } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: walletAnalysisSchema,
      prompt: `Analyze this wallet data and provide comprehensive insights about portfolio health, gas usage, and security.
      
      Consider:
      1. Portfolio balance and token distribution
      2. Historical gas spending patterns and efficiency
      3. Security risks and vulnerabilities
      4. Investment opportunities and risks
      
      Wallet Data:
      ${JSON.stringify(walletData, null, 2)}
      
      Provide a detailed analysis with specific metrics, risks, and actionable recommendations.
      
      Format your response exactly according to this schema:
      {
        "healthScore": number between 0-100,
        "portfolioDistribution": {
          "description": string describing overall distribution,
          "risks": array of risk strings,
          "opportunities": array of opportunity strings
        },
        "gasAnalysis": {
          "monthlySpending": string describing spending,
          "efficiency": number between 0-100,
          "recommendations": array of recommendation strings
        },
        "securityScore": number between 0-100,
        "recommendations": array of objects with {
          "type": one of ["security", "portfolio", "gas", "general"],
          "priority": number between 1-5 (1 is highest priority),
          "suggestion": actionable suggestion string,
          "reasoning": explanation string
        }
      }`,
    });

    // If the initial analysis shows critical issues, perform a deeper security scan
    if (analysis.securityScore < 50) {
      const { object: securityAnalysis } = await generateObject({
        model: google('gemini-2.0-flash-exp'),
        schema: z.object({
          criticalIssues: z.array(z.string()),
          immediateActions: z.array(z.string()),
          longTermStrategy: z.string()
        }),
        prompt: `Perform a detailed security analysis for this low-scoring wallet (${analysis.securityScore}/100).
        
        Current Issues:
        ${JSON.stringify(analysis.recommendations.filter(r => r.type === 'security'), null, 2)}
        
        Wallet Data:
        ${JSON.stringify(walletData, null, 2)}
        
        Focus on critical vulnerabilities and provide immediate actionable steps.`
      });

      // Merge security analysis into main analysis
      analysis.recommendations.push(...securityAnalysis.immediateActions.map(action => ({
        type: 'security',
        priority: 1,
        suggestion: action,
        reasoning: 'Critical security vulnerability detected'
      })));
    }

    // Save or update the analysis in the database
    const savedAnalysis = await prisma.walletAnalysis.upsert({
      where: {
        address_network: {
          address,
          network
        }
      },
      update: {
        analysis: analysis
      },
      create: {
        userId: user.id, // Use the authenticated user's ID
        address,
        network,
        analysis: analysis
      }
    });

    return Response.json(savedAnalysis.analysis);
  } catch (error) {
    console.error('Error analyzing wallet:', error);
    return Response.json(
      { error: 'Failed to analyze wallet data', details: error.message },
      { status: 500 }
    );
  }
}
