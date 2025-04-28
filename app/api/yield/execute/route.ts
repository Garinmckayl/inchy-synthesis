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
const CURVE_POOL_ABI = [
    "function add_liquidity(uint256[2] memory amounts, uint256 min_mint_amount)",
    "function remove_liquidity(uint256 _amount, uint256[2] memory min_amounts)"
];
const COMPOUND_ABI = [
    "function supply(address asset, uint256 amount)",
    "function withdraw(address asset, uint256 amount)"
];

// Placeholder Contract Addresses - Replace with actual mainnet addresses
const AAVE_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
const LIDO_ADDRESS = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
const EIGENLAYER_MANAGER_ADDRESS = '0x858646372CC42E1A627fcE94aa7A7033e7CF075A';
const CURVE_ETH_STETH_POOL_ADDRESS = '0xdc24316b9ae028f1497c275eb9192a3ea0f67022';
const COMPOUND_COMET_ADDRESS = '0xA17581A9E3356d9A858b789D68B4d866e593aE94';

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

        // In a real implementation, we would execute different logic based on the protocol
        // This is a placeholder for future implementation
        if (userAddress) {
            console.log(`[USER: ${userId}] Would execute transaction for address: ${userAddress}`);
            
            // Example of how real transaction execution would be implemented:
            /*
            const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
            
            let tx;
            switch (newStrategy.protocol) {
                case 'Aave':
                    const aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, AAVE_POOL_ABI, signer);
                    // Example: Supply ETH to Aave
                    tx = await aavePool.supply(WETH_ADDRESS, ethers.parseEther("0.1"), userAddress, 0);
                    break;
                case 'Lido':
                    const lido = new ethers.Contract(LIDO_ADDRESS, LIDO_ABI, signer);
                    // Example: Stake ETH in Lido
                    tx = await lido.submit(ethers.ZeroAddress, { value: ethers.parseEther("0.1") });
                    break;
                case 'EigenLayer':
                    const eigenManager = new ethers.Contract(EIGENLAYER_MANAGER_ADDRESS, EIGENLAYER_STRATEGY_MANAGER_ABI, signer);
                    // Example: Deposit into EigenLayer strategy
                    tx = await eigenManager.depositIntoStrategy(STRATEGY_ADDRESS, WETH_ADDRESS, ethers.parseEther("0.1"));
                    break;
                case 'Curve Finance':
                    const curvePool = new ethers.Contract(CURVE_ETH_STETH_POOL_ADDRESS, CURVE_POOL_ABI, signer);
                    // Example: Add liquidity to Curve ETH/stETH pool
                    // [ETH amount, stETH amount]
                    const amounts = [ethers.parseEther("0.1"), 0];
                    tx = await curvePool.add_liquidity(amounts, 0, { value: ethers.parseEther("0.1") });
                    break;
                case 'Compound':
                    const compound = new ethers.Contract(COMPOUND_COMET_ADDRESS, COMPOUND_ABI, signer);
                    // Example: Supply ETH to Compound
                    tx = await compound.supply(WETH_ADDRESS, ethers.parseEther("0.1"));
                    break;
                default:
                    throw new Error(`Unsupported protocol: ${newStrategy.protocol}`);
            }
            
            await tx.wait();
            return {
                success: true,
                message: `Successfully executed rebalance to ${newStrategy.protocol}.`,
                txHash: tx.hash
            };
            */
        }

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