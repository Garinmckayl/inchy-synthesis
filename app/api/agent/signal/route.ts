/**
 * GET  /api/agent/signal?symbol=ETH — x402 trading signal service
 * POST /api/agent/signal — batch signal request
 *
 * x402 micropayment: 0.001 USDC per signal on Base
 * Other agents can discover and pay for this service
 */
import { NextRequest, NextResponse } from 'next/server'
import { serveSignalViaX402, generateTradeSignal, BASE_TOKENS } from '@/core/defi/trading-agent'

export const maxDuration = 30

// x402 payment info for this service
const X402_PAYMENT_INFO = {
  amount: '0.001',
  currency: 'USDC',
  network: 'base',
  recipient: process.env.AGENT_SERVICE_WALLET ?? '0x0bd3DEb071beFfad807acD30E7A962e7ad8d699f',
  tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol') ?? 'ETH'
  const requestingAgent = req.headers.get('x-agent-id') ?? 'anonymous'

  // x402 header check (payment proof from requesting agent)
  const paymentHeader = req.headers.get('x-payment') ?? req.headers.get('x-402-payment')

  // If no payment, return 402 with payment info (x402 protocol)
  if (!paymentHeader && process.env.REQUIRE_X402_PAYMENT === 'true') {
    return NextResponse.json({
      error: 'Payment Required',
      x402: {
        ...X402_PAYMENT_INFO,
        description: 'Pay 0.001 USDC on Base to receive trading signal',
        paymentInstructions: 'Send USDC to the recipient address on Base, include tx hash in x-payment header',
      }
    }, {
      status: 402,
      headers: {
        'x-402-amount': X402_PAYMENT_INFO.amount,
        'x-402-currency': X402_PAYMENT_INFO.currency,
        'x-402-network': X402_PAYMENT_INFO.network,
        'x-402-recipient': X402_PAYMENT_INFO.recipient,
      }
    })
  }

  try {
    const tokenMap: Record<string, string> = {
      'ETH': BASE_TOKENS.WETH,
      'WETH': BASE_TOKENS.WETH,
      'cbETH': BASE_TOKENS.cbETH,
    }
    const tokenAddress = tokenMap[symbol.toUpperCase()] ?? BASE_TOKENS.WETH

    const { signal } = await serveSignalViaX402(requestingAgent, symbol)

    return NextResponse.json({
      signal,
      service: {
        name: 'Inchy Signal Service',
        price: `${X402_PAYMENT_INFO.amount} ${X402_PAYMENT_INFO.currency}`,
        network: X402_PAYMENT_INFO.network,
        paymentAddress: X402_PAYMENT_INFO.recipient,
      },
      x402: {
        paid: !!paymentHeader,
        paymentReceived: paymentHeader ?? null,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { symbols = ['ETH'] } = await req.json()

    const signals = await Promise.allSettled(
      symbols.map(async (symbol: string) => {
        const tokenMap: Record<string, string> = {
          'ETH': BASE_TOKENS.WETH,
          'WETH': BASE_TOKENS.WETH,
          'cbETH': BASE_TOKENS.cbETH,
        }
        const tokenAddress = tokenMap[symbol.toUpperCase()] ?? BASE_TOKENS.WETH
        return generateTradeSignal(tokenAddress, symbol)
      })
    )

    return NextResponse.json({
      signals: signals
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value),
      count: symbols.length,
      x402: X402_PAYMENT_INFO,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
