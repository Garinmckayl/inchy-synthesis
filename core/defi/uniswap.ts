/**
 * Uniswap V3/V4 Integration for Inchy.ai
 * Real token swaps on Base (mainnet) and Sepolia (testnet)
 * Uses Uniswap Developer Platform API + viem for execution
 */

import { createPublicClient, createWalletClient, http, parseEther, parseUnits, formatUnits, encodeFunctionData } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Uniswap V3 SwapRouter02 on Base
const UNISWAP_V3_ROUTER_BASE = '0x2626664c2603336E57B271c5C0b26F421741e481' as `0x${string}`
// UNISWAP_QUOTER_V2_BASE defined below as QUOTER_V2_BASE
const PERMIT2_BASE = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as `0x${string}`

// Well-known token addresses on Base
export const BASE_TOKENS = {
  ETH:  '0x0000000000000000000000000000000000000000' as `0x${string}`,
  WETH: '0x4200000000000000000000000000000000000006' as `0x${string}`,
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
  USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`,
  DAI:  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as `0x${string}`,
  cbETH:'0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' as `0x${string}`,
}

// ERC-20 ABI (minimal)
const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const

// Uniswap V3 Router ABI (exactInputSingle)
const ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenIn', type: 'address' },
        { name: 'tokenOut', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'recipient', type: 'address' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOutMinimum', type: 'uint256' },
        { name: 'sqrtPriceLimitX96', type: 'uint160' },
      ]
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }]
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }]
  },
] as const

// Quoter V2 ABI
const QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenIn', type: 'address' },
        { name: 'tokenOut', type: 'address' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'fee', type: 'uint24' },
        { name: 'sqrtPriceLimitX96', type: 'uint160' },
      ]
    }],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ]
  }
] as const

export interface SwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: string   // human-readable (e.g. "0.01" for 0.01 ETH)
  slippageBps?: number  // basis points, default 50 (0.5%)
  recipient: string
  chainId?: 'base' | 'base-sepolia'
}

export interface SwapQuote {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  priceImpact: number
  fee: number
  gasEstimate: string
  route: string
}

export interface SwapResult {
  txHash: string
  blockNumber: number
  amountIn: string
  amountOut: string
  tokenIn: string
  tokenOut: string
  explorerUrl: string
  success: boolean
}

/**
 * Get a Uniswap Developer Platform quote via their API
 * Falls back to on-chain QuoterV2 if API key not set
 */
export async function getSwapQuote(params: SwapParams): Promise<SwapQuote> {
  const chain = params.chainId === 'base-sepolia' ? baseSepolia : base
  const uniswapApiKey = process.env.UNISWAP_API_KEY

  const tokenIn = params.tokenIn === 'ETH' || params.tokenIn === BASE_TOKENS.ETH
    ? BASE_TOKENS.WETH
    : params.tokenIn as `0x${string}`

  const tokenOut = params.tokenOut === 'ETH' || params.tokenOut === BASE_TOKENS.ETH
    ? BASE_TOKENS.WETH
    : params.tokenOut as `0x${string}`

  // Try Uniswap Developer Platform API first
  if (uniswapApiKey) {
    try {
      const resp = await fetch(
        `https://api.uniswap.org/v1/quote?tokenInAddress=${tokenIn}&tokenInChainId=${chain.id}&tokenOutAddress=${tokenOut}&tokenOutChainId=${chain.id}&amount=${params.amountIn}&type=exactIn`,
        { headers: { 'x-api-key': uniswapApiKey, 'Content-Type': 'application/json' } }
      )
      if (resp.ok) {
        const data = await resp.json()
        return {
          tokenIn,
          tokenOut,
          amountIn: params.amountIn,
          amountOut: data.quote?.amount ?? '0',
          priceImpact: data.quote?.priceImpact ?? 0,
          fee: data.quote?.routeString?.includes('0.05%') ? 500 : 3000,
          gasEstimate: data.quote?.gasUseEstimateUSD ?? '~$1',
          route: data.quote?.routeString ?? `${tokenIn} → ${tokenOut}`,
        }
      }
    } catch (e) {
      console.warn('Uniswap API quote failed, falling back to on-chain QuoterV2:', e)
    }
  }

  // On-chain fallback via QuoterV2
  const publicClient = createPublicClient({ chain, transport: http() })

  const feeTiers = [500, 3000, 10000] as const
  let bestQuote = { amountOut: 0n, fee: 3000 as number, gasEstimate: 0n }

  for (const fee of feeTiers) {
    try {
      const amountInWei = params.tokenIn.includes('0x6') || params.tokenIn === 'ETH'
        ? parseEther(params.amountIn)
        : parseUnits(params.amountIn, 6)

      const result = await publicClient.readContract({
        address: QUOTER_V2_BASE,
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{ tokenIn, tokenOut, amountIn: amountInWei, fee, sqrtPriceLimitX96: 0n }]
      })
      if (result[0] > bestQuote.amountOut) {
        bestQuote = { amountOut: result[0], fee, gasEstimate: result[3] }
      }
    } catch (_) { /* pool may not exist at this fee tier */ }
  }

  const amountOutFormatted = formatUnits(bestQuote.amountOut, 
    tokenOut === BASE_TOKENS.USDC ? 6 : 18)

  return {
    tokenIn,
    tokenOut,
    amountIn: params.amountIn,
    amountOut: amountOutFormatted,
    priceImpact: 0.1,
    fee: bestQuote.fee,
    gasEstimate: formatUnits(bestQuote.gasEstimate * 2n, 9) + ' gwei',
    route: `${params.tokenIn} → ${params.tokenOut} (${bestQuote.fee / 10000}% fee)`,
  }
}

const QUOTER_V2_BASE = '0x3d4e44Eb1374240CE5F1B136588e609fd68F1a48' as `0x${string}`

/**
 * Execute a real swap on Uniswap V3 via Base
 * Requires AGENT_PRIVATE_KEY env var
 */
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const chain = params.chainId === 'base-sepolia' ? baseSepolia : base
  const privateKey = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined

  if (!privateKey) {
    throw new Error('AGENT_PRIVATE_KEY not set — cannot execute swap')
  }

  const account = privateKeyToAccount(privateKey)
  const publicClient = createPublicClient({ chain, transport: http() })
  const walletClient = createWalletClient({ account, chain, transport: http() })

  const tokenIn = params.tokenIn === 'ETH' || params.tokenIn === BASE_TOKENS.ETH
    ? BASE_TOKENS.WETH
    : params.tokenIn as `0x${string}`

  const tokenOut = params.tokenOut === 'ETH' || params.tokenOut === BASE_TOKENS.ETH
    ? BASE_TOKENS.WETH
    : params.tokenOut as `0x${string}`

  const isNativeIn = params.tokenIn === 'ETH' || params.tokenIn === BASE_TOKENS.ETH
  const decimalsIn = tokenIn === BASE_TOKENS.USDC ? 6 : 18
  const amountInWei = parseUnits(params.amountIn, decimalsIn)

  const slippageBps = params.slippageBps ?? 50
  const quote = await getSwapQuote(params)
  const amountOutMin = parseUnits(
    (parseFloat(quote.amountOut) * (1 - slippageBps / 10000)).toFixed(6),
    tokenOut === BASE_TOKENS.USDC ? 6 : 18
  )

  // Approve if ERC-20 input
  if (!isNativeIn) {
    const allowance = await publicClient.readContract({
      address: tokenIn,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account.address, UNISWAP_V3_ROUTER_BASE]
    })
    if (allowance < amountInWei) {
      const approveTx = await walletClient.writeContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNISWAP_V3_ROUTER_BASE, amountInWei * 10n]
      })
      await publicClient.waitForTransactionReceipt({ hash: approveTx })
    }
  }

  // Execute swap
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800)
  const swapTx = await walletClient.writeContract({
    address: UNISWAP_V3_ROUTER_BASE,
    abi: ROUTER_ABI,
    functionName: 'exactInputSingle',
    args: [{
      tokenIn,
      tokenOut,
      fee: quote.fee,
      recipient: params.recipient as `0x${string}`,
      amountIn: amountInWei,
      amountOutMinimum: amountOutMin,
      sqrtPriceLimitX96: 0n,
    }],
    value: isNativeIn ? amountInWei : 0n,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTx })
  const explorerBase = chain.id === 8453 ? 'https://basescan.org' : 'https://sepolia.basescan.org'

  return {
    txHash: swapTx,
    blockNumber: Number(receipt.blockNumber),
    amountIn: params.amountIn,
    amountOut: quote.amountOut,
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    explorerUrl: `${explorerBase}/tx/${swapTx}`,
    success: receipt.status === 'success',
  }
}

/**
 * Get current price for a token pair via Uniswap
 */
export async function getTokenPrice(
  tokenIn: string,
  tokenOut: string,
  chainId: 'base' | 'base-sepolia' = 'base'
): Promise<number> {
  try {
    const quote = await getSwapQuote({
      tokenIn,
      tokenOut,
      amountIn: '1',
      recipient: '0x0000000000000000000000000000000000000000',
      chainId,
    })
    return parseFloat(quote.amountOut)
  } catch {
    return 0
  }
}
