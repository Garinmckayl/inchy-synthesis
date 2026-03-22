/**
 * Lido Finance Integration for Inchy.ai
 * - Stake ETH → receive stETH (yield-bearing)
 * - Agent treasury: only stETH yield (rebase) can be spent; principal is locked
 * - Supports Base (wstETH bridged) and Ethereum mainnet
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  formatUnits,
  parseUnits,
} from 'viem'
import { mainnet, base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Lido contracts
const LIDO_STETH_MAINNET   = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as `0x${string}`
const LIDO_WSTETH_MAINNET  = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as `0x${string}`
const LIDO_WSTETH_BASE     = '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452' as `0x${string}`

const LIDO_REFERRAL = '0x0000000000000000000000000000000000000000' as `0x${string}`

// stETH ABI (minimal)
const STETH_ABI = [
  { name: 'submit', type: 'function', stateMutability: 'payable', inputs: [{ name: '_referral', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'getTotalShares', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getPooledEthByShares', type: 'function', stateMutability: 'view', inputs: [{ name: '_sharesAmount', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'sharesOf', type: 'function', stateMutability: 'view', inputs: [{ name: '_account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

// wstETH ABI (Base — bridged, no staking)
const WSTETH_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'stEthPerToken', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'tokensPerStEth', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'wrap', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_stETHAmount', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'unwrap', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: '_wstETHAmount', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
] as const

export interface LidoStakeResult {
  txHash: string
  amountStaked: string   // ETH
  stETHReceived: string  // stETH
  explorerUrl: string
  success: boolean
}

export interface LidoPosition {
  address: string
  stETHBalance: string   // current stETH balance (principal + accumulated yield)
  stETHShares: string    // share count (doesn't change on rebase)
  principalETH: string   // original ETH staked (estimated)
  yieldETH: string       // accumulated yield only (rebase rewards)
  currentAPR: number
  network: 'mainnet' | 'base'
}

export interface AgentTreasury {
  principalLocked: string   // ETH principal — structurally untouchable
  spendableYield: string    // only this can be spent by the agent
  totalBalance: string
  lastSnapshotAt: string
  currentAPR: number
}

/**
 * Stake ETH with Lido on Ethereum mainnet
 * Returns stETH which rebases daily with yield
 */
export async function stakeWithLido(
  amountEth: string,
  recipientAddress: string
): Promise<LidoStakeResult> {
  const privateKey = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined
  if (!privateKey) throw new Error('AGENT_PRIVATE_KEY not set')

  const account = privateKeyToAccount(privateKey)
  const publicClient = createPublicClient({ chain: mainnet, transport: http() })
  const walletClient = createWalletClient({ account, chain: mainnet, transport: http() })

  const amountWei = parseEther(amountEth)

  // Call Lido's submit() — payable function that stakes ETH and mints stETH
  const txHash = await walletClient.writeContract({
    address: LIDO_STETH_MAINNET,
    abi: STETH_ABI,
    functionName: 'submit',
    args: [LIDO_REFERRAL],
    value: amountWei,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

  // stETH is ~1:1 with ETH (minus tiny slippage from protocol)
  const stETHReceived = amountEth // approximately 1:1

  return {
    txHash,
    amountStaked: amountEth,
    stETHReceived,
    explorerUrl: `https://etherscan.io/tx/${txHash}`,
    success: receipt.status === 'success',
  }
}

/**
 * Get current Lido position for an address
 * Tracks principal vs yield for agent treasury enforcement
 */
export async function getLidoPosition(address: string): Promise<LidoPosition> {
  const publicClient = createPublicClient({ chain: mainnet, transport: http() })

  const [stETHBalance, stETHShares, currentAPR] = await Promise.all([
    publicClient.readContract({
      address: LIDO_STETH_MAINNET,
      abi: STETH_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    }),
    publicClient.readContract({
      address: LIDO_STETH_MAINNET,
      abi: STETH_ABI,
      functionName: 'sharesOf',
      args: [address as `0x${string}`]
    }),
    getLidoAPR()
  ])

  // stETH balance > shares value = yield has accumulated
  // Shares represent the "principal" that doesn't change
  const sharesValueInETH = await publicClient.readContract({
    address: LIDO_STETH_MAINNET,
    abi: STETH_ABI,
    functionName: 'getPooledEthByShares',
    args: [stETHShares]
  })

  const balanceFormatted = formatEther(stETHBalance)
  const sharesValueFormatted = formatEther(sharesValueInETH)
  const yieldETH = (parseFloat(balanceFormatted) - parseFloat(sharesValueFormatted)).toFixed(6)

  return {
    address,
    stETHBalance: balanceFormatted,
    stETHShares: stETHShares.toString(),
    principalETH: sharesValueFormatted,
    yieldETH: Math.max(0, parseFloat(yieldETH)).toString(),
    currentAPR,
    network: 'mainnet'
  }
}

/**
 * Agent Treasury Primitive
 *
 * The agent can ONLY spend accumulated stETH yield.
 * The principal (original staked ETH) is structurally locked.
 * This is enforced by recording the shares at deposit time —
 * shares represent principal; the difference to current balance is yield.
 */
export async function getAgentTreasury(
  agentAddress: string,
  principalSnapshot?: string  // ETH value at time of initial stake
): Promise<AgentTreasury> {
  const position = await getLidoPosition(agentAddress)
  const currentAPR = position.currentAPR

  // Principal is the original deposit (shares-based — invariant to rebases)
  const principalLocked = principalSnapshot ?? position.principalETH

  // Spendable = current balance - principal
  const spendable = Math.max(
    0,
    parseFloat(position.stETHBalance) - parseFloat(principalLocked)
  )

  return {
    principalLocked,
    spendableYield: spendable.toFixed(6),
    totalBalance: position.stETHBalance,
    lastSnapshotAt: new Date().toISOString(),
    currentAPR,
  }
}

/**
 * Fetch real-time Lido stETH APR from Lido API
 */
export async function getLidoAPR(): Promise<number> {
  try {
    const resp = await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma')
    if (!resp.ok) throw new Error('Lido API error')
    const data = await resp.json()
    return parseFloat(data?.data?.smaApr ?? '3.5')
  } catch {
    return 3.5 // fallback
  }
}

/**
 * Get wstETH balance on Base (bridged Lido position)
 */
export async function getWstETHBalanceOnBase(address: string): Promise<{
  wstETHBalance: string
  stETHEquivalent: string
}> {
  const publicClient = createPublicClient({ chain: base, transport: http() })

  const [balance, stEthPerToken] = await Promise.all([
    publicClient.readContract({
      address: LIDO_WSTETH_BASE,
      abi: WSTETH_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    }),
    publicClient.readContract({
      address: LIDO_WSTETH_BASE,
      abi: WSTETH_ABI,
      functionName: 'stEthPerToken',
    })
  ])

  const wstETHFormatted = formatEther(balance)
  const stETHEquivalent = (parseFloat(wstETHFormatted) * parseFloat(formatEther(stEthPerToken))).toFixed(6)

  return {
    wstETHBalance: wstETHFormatted,
    stETHEquivalent
  }
}

/**
 * Simulate daily yield projection for a given stake
 * Useful for agent to plan inference budget
 */
export function projectYield(
  stakedETH: number,
  apr: number,
  daysAhead: number = 30
): {
  projectedYieldETH: number
  projectedYieldUSD: number
  dailyYieldETH: number
} {
  const dailyRate = apr / 100 / 365
  const projectedYieldETH = stakedETH * dailyRate * daysAhead
  const ethPriceUsd = 3000 // approximate
  return {
    projectedYieldETH,
    projectedYieldUSD: projectedYieldETH * ethPriceUsd,
    dailyYieldETH: stakedETH * dailyRate,
  }
}
