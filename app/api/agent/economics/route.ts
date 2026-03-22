/**
 * GET /api/agent/economics
 * Shows agent self-funding economics:
 * - Revenue earned (swap fees, strategy fees, yield)
 * - Inference costs paid via Bankr wallet
 * - Net profit / sustainability status
 */
import { NextResponse } from 'next/server'
import { getAgentEconomics, getRevenueLog, getBankrWalletBalance } from '@/core/defi/bankr'
import { getAgentPerformance } from '@/core/defi/trading-agent'

export async function GET() {
  const [economics, revenueLog, wallet, trading] = await Promise.all([
    getAgentEconomics(),
    Promise.resolve(getRevenueLog()),
    getBankrWalletBalance(),
    Promise.resolve(getAgentPerformance()),
  ])

  return NextResponse.json({
    agent: {
      name: 'Inchy',
      description: 'Autonomous AI crypto asset manager on Base',
      walletAddress: wallet.address || process.env.AGENT_WALLET_ADDRESS,
    },
    economics: {
      ...economics,
      status: economics.isSelfsustaining ? 'SELF_SUSTAINING' : 'BOOTSTRAPPING',
      message: economics.isSelfsustaining
        ? `Agent has earned $${economics.revenueEarnedUSD.toFixed(4)} and spent $${economics.inferenceCostUSD.toFixed(4)} on inference — fully self-funded`
        : `Agent is bootstrapping: $${economics.revenueEarnedUSD.toFixed(4)} revenue vs $${economics.inferenceCostUSD.toFixed(4)} inference costs`,
    },
    revenueBreakdown: revenueLog.slice(-20),
    bankrWallet: wallet,
    tradingPerformance: trading,
    hackathonBounties: {
      bankr: 'Self-sustaining agent: revenue funds inference via Bankr LLM Gateway',
      base_trading: 'Autonomous trading agent with proven on-chain execution',
      base_service: 'x402 signal service — other agents pay 0.001 USDC per signal',
      lido: 'Agent treasury: only stETH yield is spendable; principal locked',
      uniswap: 'Real token swaps with on-chain TxIDs via Uniswap V3 on Base',
    }
  })
}
