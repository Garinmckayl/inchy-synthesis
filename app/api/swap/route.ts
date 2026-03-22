/**
 * POST /api/swap
 * Get a Uniswap quote or execute a real swap on Base
 * 
 * Body: { action: 'quote' | 'execute', tokenIn, tokenOut, amountIn, recipient?, slippageBps?, chain? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSwapQuote, executeSwap, BASE_TOKENS } from '@/core/defi/uniswap'
import { recordRevenue } from '@/core/defi/bankr'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, tokenIn, tokenOut, amountIn, recipient, slippageBps, chain } = body

    if (!tokenIn || !tokenOut || !amountIn) {
      return NextResponse.json({ error: 'tokenIn, tokenOut, amountIn required' }, { status: 400 })
    }

    const chainId = chain === 'base-sepolia' ? 'base-sepolia' : 'base'

    if (action === 'quote') {
      const quote = await getSwapQuote({
        tokenIn,
        tokenOut,
        amountIn,
        recipient: recipient ?? '0x0000000000000000000000000000000000000000',
        slippageBps,
        chainId,
      })
      return NextResponse.json({ quote })
    }

    if (action === 'execute') {
      if (!recipient) {
        return NextResponse.json({ error: 'recipient required for execute' }, { status: 400 })
      }

      const result = await executeSwap({
        tokenIn,
        tokenOut,
        amountIn,
        recipient,
        slippageBps: slippageBps ?? 50,
        chainId,
      })

      // Agent earns 0.1% fee on each swap → funds inference via Bankr
      const notionalUSD = parseFloat(amountIn) * 3000 // rough ETH price
      recordRevenue({
        source: 'swap_fee',
        amountUSD: notionalUSD * 0.001,
        txHash: result.txHash,
      })

      return NextResponse.json({ result })
    }

    return NextResponse.json({ error: 'action must be quote or execute' }, { status: 400 })
  } catch (e: any) {
    console.error('[/api/swap]', e)
    return NextResponse.json({ error: e.message ?? 'Swap failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Inchy Swap API',
    description: 'Uniswap V3 swap quotes and execution on Base',
    supportedTokens: BASE_TOKENS,
    endpoints: {
      quote: 'POST /api/swap { action: "quote", tokenIn, tokenOut, amountIn }',
      execute: 'POST /api/swap { action: "execute", tokenIn, tokenOut, amountIn, recipient }',
    },
    x402: {
      paymentRequired: false,
      note: 'Signal API at /api/agent/signal requires 0.001 USDC via x402',
    }
  })
}
