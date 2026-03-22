/**
 * POST /api/lido — Stake ETH and manage Lido positions
 * GET  /api/lido — Get current Lido position and agent treasury status
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  stakeWithLido,
  getLidoPosition,
  getAgentTreasury,
  getLidoAPR,
  getWstETHBalanceOnBase,
  projectYield,
} from '@/core/defi/lido'
import { recordRevenue } from '@/core/defi/bankr'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const view = searchParams.get('view') ?? 'position'

  if (!address) {
    // Return current APR and yield projections
    const apr = await getLidoAPR()
    return NextResponse.json({
      protocol: 'Lido',
      network: 'Ethereum Mainnet + Base (wstETH)',
      currentAPR: apr,
      token: 'stETH / wstETH',
      description: 'Stake ETH, receive stETH (rebasing yield token). Agent treasury: only yield can be spent.',
      yieldProjections: {
        stake1ETH_30days: projectYield(1, apr, 30),
        stake10ETH_30days: projectYield(10, apr, 30),
        stake100ETH_30days: projectYield(100, apr, 30),
      },
      treasuryPrimitive: {
        description: 'Deposit ETH → principal locked in Lido → only daily stETH rebase flows to agent wallet',
        enforced: 'Structurally via shares accounting (sharesOf vs balanceOf)',
        agentCanSpend: 'stETH yield only (rebase rewards)',
        principalSafe: 'Never touched by agent',
      }
    })
  }

  if (view === 'treasury') {
    const treasury = await getAgentTreasury(address)
    return NextResponse.json({ treasury })
  }

  if (view === 'base') {
    const basePosition = await getWstETHBalanceOnBase(address)
    return NextResponse.json({ basePosition })
  }

  const position = await getLidoPosition(address)
  return NextResponse.json({ position })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, amountEth, address } = body

    if (action === 'stake') {
      if (!amountEth || !address) {
        return NextResponse.json({ error: 'amountEth and address required' }, { status: 400 })
      }

      const result = await stakeWithLido(amountEth, address)

      // Staking earns yield → agent records as future revenue source
      recordRevenue({
        source: 'yield',
        amountUSD: parseFloat(amountEth) * 3000 * 0.0001, // ~first day yield
        txHash: result.txHash,
      })

      return NextResponse.json({ result })
    }

    if (action === 'position') {
      const position = await getLidoPosition(address)
      return NextResponse.json({ position })
    }

    if (action === 'treasury') {
      const { principalSnapshot } = body
      const treasury = await getAgentTreasury(address, principalSnapshot)
      return NextResponse.json({ treasury })
    }

    return NextResponse.json({ error: 'action must be stake | position | treasury' }, { status: 400 })
  } catch (e: any) {
    console.error('[/api/lido]', e)
    return NextResponse.json({ error: e.message ?? 'Lido operation failed' }, { status: 500 })
  }
}
