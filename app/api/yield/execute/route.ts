// pages/api/execute-strategy.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ethers } from 'ethers';
import { getPrivyUser } from '@/lib/privy';
import prisma from '@/lib/prisma';
import { ProtocolYield } from '@/core/defi/protocols';

// Placeholder ABIs - Replace with actual, minimal ABIs needed
const AAVE_POOL_ABI = [
    "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
    "function withdraw(address asset, uint256 amount, address to)"
];
const LIDO_ABI = [
    "function submit(address _referral) payable",
    // Lido withdrawal is more complex (request/claim), needs different handling
    "function requestWithdrawals(uint256[] _amounts, address _owner) returns (uint256)",
];
const EIGENLAYER_STRATEGY_MANAGER_ABI = [
     "function depositIntoStrategy(address strategy, address token, uint256 amount)"
];

// Placeholder Contract Addresses - Replace with actual mainnet addresses
const AAVE_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
const LIDO_ADDRESS = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
const EIGENLAYER_MANAGER_ADDRESS = '0x858646372CC42E1A627fcE94aa7A7033e7CF075A';

// Request validation schema
const executeRequestSchema = z.object({
    newStrategy: z.object({
        protocol: z.string(),
        apy: z.number(),
        tvl: z.number(),
        riskLevel: z.string(),
        token: z.string(),
        gasEstimate: z.number().optional(),
        netApy: z.number().optional()
    })
});

// export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        // 1. Get auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
        }

        // 2. Get token from header
        const token = authHeader.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        console.log('Attempting to get user with token:', token.substring(0, 10) + '...');

        // 3. Verify token and get user
        const user = await getPrivyUser(token);
        console.log('Got user response:', user);

        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // 4. Get user's wallet address
        const walletAccount = user.linkedAccounts.find(acc => acc.type === 'wallet');
        const userAddress = walletAccount?.address;

        // 5. Validate request body
        const body = await req.json();
        const { newStrategy } = executeRequestSchema.parse(body);

        // 6. Execute strategy change
        const result = await simulateRebalance(user.id, newStrategy, userAddress);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            txHash: result.txHash
        });

    } catch (error) {
        console.error('Error executing strategy:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: 'Invalid request format',
                details: error.errors 
            }, { status: 400 });
        }

        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

async function simulateRebalance(
    userId: string,
    newStrategy: ProtocolYield,
    userAddress?: string
): Promise<{ success: boolean; message: string; txHash?: string }> {

    console.log(`[USER: ${userId}] Simulating rebalance to ${newStrategy.protocol} for user EOA: ${userAddress}`);
    console.log(`[USER: ${userId}] New Strategy Details:`, newStrategy);

    const MOCK_TX_HASH = `0x${Buffer.from(Math.random().toString()).toString('hex').padStart(64, '0')}`;

    try {
        // Simulate network delay for testing
        await new Promise(res => setTimeout(res, 1500));

        // Update database state AFTER successful simulation/execution
        await prisma.userStrategy.upsert({
            where: { userId },
            create: {
                userId,
                protocol: newStrategy.protocol,
                asset: newStrategy.token,
                apy: newStrategy.apy,
                riskLevel: newStrategy.riskLevel,
            },
            update: {
                protocol: newStrategy.protocol,
                asset: newStrategy.token,
                apy: newStrategy.apy,
                riskLevel: newStrategy.riskLevel,
                updatedAt: new Date(),
            }
        });

        console.log(`[USER: ${userId}] Successfully updated database state.`);

        return {
            success: true,
            message: `Successfully initiated rebalance to ${newStrategy.protocol}.`,
            txHash: MOCK_TX_HASH
        };

    } catch (error) {
        console.error(`[USER: ${userId}] Error during rebalance:`, error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error during rebalance'
        };
    }
}