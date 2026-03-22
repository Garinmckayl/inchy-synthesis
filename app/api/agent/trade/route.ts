/**
 * POST /api/agent/trade — Execute autonomous trades
 * GET  /api/agent/trade — Get trade history and performance
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  generateTradeSignal,
  executeTrade,
  getAgentPerformance,
  getTradeBook,
  setInitialCapital,
  BASE_TOKENS,
} from '@/core/defi/trading-agent'

export const maxDuration = 60

export async function GET() {
  const performance = getAgentPerformance()
  const trades = getTradeBook()

  return NextResponse.json({
    performance,
    trades: trades.slice(-50),
    summary: {
      isLive: true,
      network: 'Base Mainnet',
      strategy: 'AI-powered momentum trading via Uniswap V3',
      selfFunding: 'Swap fees → Bankr wallet → inference costs',
      onChainProof: trades
        .filter(t => t.txHash)
        .map(t => ({
          txHash: t.txHash,
          explorerUrl: t.explorerUrl,
          pair: t.pair,
          side: t.side,
          timestamp: t.timestamp,
        })),
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, symbol, sizeUSD, agentAddress, initialCapital } = body

    if (initialCapital) {
      setInitialCapital(initialCapital)
    }

    if (action === 'signal') {
      const tokenMap: Record<string, string> = {
        'ETH': BASE_TOKENS.WETH,
        'WETH': BASE_TOKENS.WETH,
        'cbETH': BASE_TOKENS.cbETH,
      }
      const sym = symbol ?? 'ETH'
      const tokenAddress = tokenMap[sym.toUpperCase()] ?? BASE_TOKENS.WETH
      const signal = await generateTradeSignal(tokenAddress, sym)
      return NextResponse.json({ signal })
    }

    if (action === 'execute') {
      if (!symbol || !sizeUSD || !agentAddress) {
        return NextResponse.json(
          { error: 'symbol, sizeUSD, agentAddress required' },
          { status: 400 }
        )
      }

      const tokenMap: Record<string, string> = {
        'ETH': BASE_TOKENS.WETH,
        'WETH': BASE_TOKENS.WETH,
      }
      const tokenAddress = tokenMap[symbol.toUpperCase()] ?? BASE_TOKENS.WETH
      const signal = await generateTradeSignal(tokenAddress, symbol)

      const trade = await executeTrade(signal, sizeUSD, agentAddress)
      if (!trade) {
        return NextResponse.json({
          skipped: true,
          reason: `Signal was ${signal.direction} with ${signal.confidence}% confidence — threshold not met`,
          signal,
        })
      }

      return NextResponse.json({ trade, signal })
    }

    return NextResponse.json(
      { error: 'action must be signal | execute' },
      { status: 400 }
    )
  } catch (e: any) {
    console.error('[/api/agent/trade]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
