/**
 * Uniswap Trading API Integration for Inchy.ai
 * Uses the official Uniswap Trading API (trade-api.gateway.uniswap.org/v1)
 * with the swap-integration skill pattern: check_approval → quote → swap
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  isAddress,
  isHex,
  type Address,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Uniswap Trading API — must be called server-side (no CORS on browser)
const TRADING_API = 'https://trade-api.gateway.uniswap.org/v1'

// Uniswap V3 SwapRouter02 on Base (fallback direct execution)
const UNISWAP_V3_ROUTER_BASE = '0x2626664c2603336E57B271c5C0b26F421741e481' as Address
const QUOTER_V2_BASE         = '0x3d4e44Eb1374240CE5F1B136588e609fd68F1a48' as Address
const PERMIT2_BASE           = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as Address

// Universal Router v4 on Base
const UNIVERSAL_ROUTER_BASE  = '0x6ff5693b99212da76ad316178a184ab56d299b43' as Address

// Well-known token addresses on Base
export const BASE_TOKENS = {
  ETH:   '0x0000000000000000000000000000000000000000' as Address,
  WETH:  '0x4200000000000000000000000000000000000006' as Address,
  USDC:  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  USDT:  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as Address,
  DAI:   '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as Address,
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' as Address,
}

const TOKEN_DECIMALS: Record<string, number> = {
  [BASE_TOKENS.USDC]: 6,
  [BASE_TOKENS.USDT]: 6,
  [BASE_TOKENS.DAI]:  18,
  [BASE_TOKENS.WETH]: 18,
  [BASE_TOKENS.ETH]:  18,
  [BASE_TOKENS.cbETH]:18,
}

function decimalsFor(addr: string): number {
  return TOKEN_DECIMALS[addr.toLowerCase()] ?? TOKEN_DECIMALS[addr] ?? 18
}

function apiHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-universal-router-version': '2.0',
  }
}

export interface SwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: string   // human-readable, e.g. "0.01"
  slippageBps?: number
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
  routing: string   // CLASSIC | DUTCH_V2 | PRIORITY etc.
  rawQuote?: unknown
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
 * Step 1+2: Get a quote from the Uniswap Trading API
 * Falls back to on-chain QuoterV2 if no API key
 */
export async function getSwapQuote(params: SwapParams): Promise<SwapQuote> {
  const chain = params.chainId === 'base-sepolia' ? baseSepolia : base
  const apiKey = process.env.UNISWAP_API_KEY

  const tokenIn  = params.tokenIn  === 'ETH' ? BASE_TOKENS.ETH  : params.tokenIn  as Address
  const tokenOut = params.tokenOut === 'ETH' ? BASE_TOKENS.ETH  : params.tokenOut as Address

  const decimalsIn = decimalsFor(tokenIn)
  const amountInWei = parseUnits(params.amountIn, decimalsIn).toString()

  if (apiKey) {
    try {
      const resp = await fetch(`${TRADING_API}/quote`, {
        method: 'POST',
        headers: apiHeaders(apiKey),
        body: JSON.stringify({
          swapper: params.recipient,
          tokenIn,
          tokenOut,
          tokenInChainId: String(chain.id),
          tokenOutChainId: String(chain.id),
          amount: amountInWei,
          type: 'EXACT_INPUT',
          slippageTolerance: (params.slippageBps ?? 50) / 100,
          routingPreference: 'BEST_PRICE',
        }),
      })

      if (resp.ok) {
        const data = await resp.json()
        const routing: string = data.routing ?? 'CLASSIC'
        const isUniswapX = ['DUTCH_V2', 'DUTCH_V3', 'PRIORITY'].includes(routing)

        let amountOut = '0'
        if (isUniswapX) {
          const output = data.quote?.orderInfo?.outputs?.[0]
          amountOut = output
            ? formatUnits(BigInt(output.startAmount), decimalsFor(tokenOut))
            : '0'
        } else {
          amountOut = data.quote?.output?.amount
            ? formatUnits(BigInt(data.quote.output.amount), decimalsFor(tokenOut))
            : '0'
        }

        return {
          tokenIn,
          tokenOut,
          amountIn: params.amountIn,
          amountOut,
          priceImpact: parseFloat(data.quote?.priceImpact ?? data.priceImpact ?? '0.1'),
          fee: 3000,
          gasEstimate: data.quote?.gasFeeUSD ? `~$${parseFloat(data.quote.gasFeeUSD).toFixed(4)}` : isUniswapX ? 'gasless' : '~$0.01',
          route: data.quote?.routeString ?? routing,
          routing,
          rawQuote: data,
        }
      } else {
        const err = await resp.json().catch(() => ({}))
        console.warn('Uniswap Trading API quote failed:', err)
      }
    } catch (e) {
      console.warn('Uniswap Trading API error, falling back to QuoterV2:', e)
    }
  }

  // On-chain QuoterV2 fallback
  return quoterV2Fallback(tokenIn, tokenOut, params.amountIn, chain)
}

/**
 * Execute a real swap via Uniswap Trading API (3-step: approval → quote → swap)
 */
export async function executeSwap(params: SwapParams): Promise<SwapResult> {
  const chain = params.chainId === 'base-sepolia' ? baseSepolia : base
  const apiKey = process.env.UNISWAP_API_KEY
  const privateKey = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined
  if (!privateKey) throw new Error('AGENT_PRIVATE_KEY not set')

  const account = privateKeyToAccount(privateKey)
  const publicClient = createPublicClient({ chain, transport: http() })
  const walletClient = createWalletClient({ account, chain, transport: http() })

  const tokenIn  = params.tokenIn  === 'ETH' ? BASE_TOKENS.ETH  : params.tokenIn  as Address
  const tokenOut = params.tokenOut === 'ETH' ? BASE_TOKENS.ETH  : params.tokenOut as Address
  const decimalsIn = decimalsFor(tokenIn)
  const amountInWei = parseUnits(params.amountIn, decimalsIn).toString()
  const explorerBase = chain.id === 8453 ? 'https://basescan.org' : 'https://sepolia.basescan.org'

  if (apiKey) {
    // Step 1: Check approval
    const isNative = tokenIn === BASE_TOKENS.ETH
    if (!isNative) {
      const approvalResp = await fetch(`${TRADING_API}/check_approval`, {
        method: 'POST',
        headers: apiHeaders(apiKey),
        body: JSON.stringify({
          walletAddress: account.address,
          token: tokenIn,
          amount: amountInWei,
          chainId: chain.id,
        }),
      })
      if (approvalResp.ok) {
        const { approval } = await approvalResp.json()
        if (approval) {
          const hash = await walletClient.sendTransaction({
            to: approval.to,
            data: approval.data,
            value: BigInt(approval.value || '0'),
          })
          await publicClient.waitForTransactionReceipt({ hash })
        }
      }
    }

    // Step 2: Get quote
    const quoteResp = await fetch(`${TRADING_API}/quote`, {
      method: 'POST',
      headers: apiHeaders(apiKey),
      body: JSON.stringify({
        swapper: account.address,
        tokenIn,
        tokenOut,
        tokenInChainId: String(chain.id),
        tokenOutChainId: String(chain.id),
        amount: amountInWei,
        type: 'EXACT_INPUT',
        slippageTolerance: (params.slippageBps ?? 50) / 100,
        routingPreference: 'BEST_PRICE',
      }),
    })
    if (!quoteResp.ok) {
      const err = await quoteResp.json().catch(() => ({}))
      throw new Error(`Uniswap quote failed: ${JSON.stringify(err)}`)
    }
    const quoteResponse = await quoteResp.json()
    const routing: string = quoteResponse.routing ?? 'CLASSIC'
    const isUniswapX = ['DUTCH_V2', 'DUTCH_V3', 'PRIORITY'].includes(routing)

    // Step 3: Get swap transaction (routing-aware, strip permitData for UniswapX)
    const { permitData, permitTransaction, ...cleanQuote } = quoteResponse
    const swapRequest: Record<string, unknown> = { ...cleanQuote }
    if (!isUniswapX && permitData && typeof permitData === 'object') {
      // CLASSIC with Permit2 — would need signature; skip for agent (uses direct approval)
    }

    const swapResp = await fetch(`${TRADING_API}/swap`, {
      method: 'POST',
      headers: apiHeaders(apiKey),
      body: JSON.stringify(swapRequest),
    })
    if (!swapResp.ok) {
      const err = await swapResp.json().catch(() => ({}))
      throw new Error(`Uniswap swap failed: ${JSON.stringify(err)}`)
    }
    const { swap } = await swapResp.json()

    // Validate before broadcast
    if (!swap?.data || swap.data === '' || swap.data === '0x') {
      throw new Error('swap.data is empty — quote may have expired, re-fetch')
    }
    if (!isHex(swap.data) || !isAddress(swap.to)) {
      throw new Error('Invalid swap transaction from API')
    }

    const txHash = await walletClient.sendTransaction({
      to: swap.to,
      data: swap.data,
      value: BigInt(swap.value || '0'),
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    const decimalsOut = decimalsFor(tokenOut)
    const amountOut = isUniswapX
      ? formatUnits(BigInt(quoteResponse.quote?.orderInfo?.outputs?.[0]?.startAmount ?? '0'), decimalsOut)
      : formatUnits(BigInt(quoteResponse.quote?.output?.amount ?? '0'), decimalsOut)

    return {
      txHash,
      blockNumber: Number(receipt.blockNumber),
      amountIn: params.amountIn,
      amountOut,
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      explorerUrl: `${explorerBase}/tx/${txHash}`,
      success: receipt.status === 'success',
    }
  }

  throw new Error('UNISWAP_API_KEY required for swap execution')
}

/**
 * Get current price for a token pair
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

// ── On-chain fallback ────────────────────────────────────────────────────────

const QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{
      name: 'params', type: 'tuple',
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

async function quoterV2Fallback(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: string,
  chain: typeof base | typeof baseSepolia
): Promise<SwapQuote> {
  const publicClient = createPublicClient({ chain, transport: http() })
  const wethIn  = tokenIn  === BASE_TOKENS.ETH ? BASE_TOKENS.WETH : tokenIn
  const wethOut = tokenOut === BASE_TOKENS.ETH ? BASE_TOKENS.WETH : tokenOut
  const amountInWei = parseUnits(amountIn, decimalsFor(tokenIn))

  const feeTiers = [500, 3000, 10000] as const
  let best = { amountOut: 0n, fee: 3000 as number }

  for (const fee of feeTiers) {
    try {
      const result = await publicClient.readContract({
        address: QUOTER_V2_BASE,
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{ tokenIn: wethIn, tokenOut: wethOut, amountIn: amountInWei, fee, sqrtPriceLimitX96: 0n }]
      })
      if (result[0] > best.amountOut) best = { amountOut: result[0], fee }
    } catch { /* pool may not exist at this fee tier */ }
  }

  return {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut: formatUnits(best.amountOut, decimalsFor(wethOut)),
    priceImpact: 0.1,
    fee: best.fee,
    gasEstimate: '~$0.01',
    route: `${tokenIn} → ${tokenOut} (${best.fee / 10000}% fee, on-chain fallback)`,
    routing: 'CLASSIC',
  }
}
