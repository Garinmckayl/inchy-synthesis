// pages/api/current-strategy.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPrivyUser } from '@/lib/privy';

export async function GET(req: NextRequest) {
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
        console.log('User:', user);

        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // 4. Get user's wallet address
        // const walletAccount = user.linkedAccounts.find(acc => acc.type === 'wallet');
        // if (!walletAccount?.address) {
        //     return NextResponse.json({ error: 'No wallet linked to account' }, { status: 400 });
        // }

        // 5. Get current strategy
        const currentStrategy = await prisma.userStrategy.findFirst({
            where: {
                userId: user.id,
                // active: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!currentStrategy) {
            return NextResponse.json({ currentStrategy: null });
        }

        // 6. Format response
        const formattedStrategy = {
            protocol: currentStrategy.protocol,
            apy: currentStrategy.apy,
            tvl: 0, // Placeholder - Need to fetch live TVL if required
            riskLevel: currentStrategy.riskLevel,
            token: currentStrategy.asset,
            gasEstimate: 0 // Placeholder - Gas estimate isn't typically stored
        };

        return NextResponse.json({ currentStrategy: formattedStrategy });

    } catch (error) {
        console.error('Error getting current strategy:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}