/**
 * Bankr LLM Gateway Integration for Inchy.ai
 *
 * Self-funding agent economics:
 * - Inchy earns revenue from: swap fees, strategy execution fees, subscription
 * - Those revenues auto-fund the Bankr wallet
 * - Every LLM call is paid from the Bankr wallet balance
 * - The agent is fully self-sustaining: revenue → inference → more revenue
 *
 * Bankr provides: 20+ LLMs + real onchain wallet in one API
 * Docs: https://bankr.bot
 */

export interface BankrMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface BankrResponse {
  id: string
  model: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    costUSD: number
  }
  wallet: {
    balanceUSD: number
    balanceETH: string
    address: string
  }
}

export interface AgentEconomics {
  revenueEarnedUSD: number
  inferenceCostUSD: number
  netProfitUSD: number
  walletBalanceUSD: number
  walletAddress: string
  isSelfsustaining: boolean
  inferencesFundedByRevenue: number
}

// Revenue sources the agent tracks
export type RevenueSource = 'swap_fee' | 'strategy_fee' | 'subscription' | 'yield'

export interface RevenueEvent {
  source: RevenueSource
  amountUSD: number
  txHash?: string
  timestamp: string
}

let revenueLog: RevenueEvent[] = []
let totalRevenue = 0
let totalInferenceCost = 0

/**
 * Call an LLM via Bankr Gateway
 * Costs are deducted from the Bankr wallet automatically
 * Revenue from Inchy operations pre-funds this wallet
 */
export async function callBankrLLM(
  messages: BankrMessage[],
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  }
): Promise<BankrResponse> {
  const apiKey = process.env.BANKR_API_KEY
  if (!apiKey) {
    throw new Error('BANKR_API_KEY not set — self-funding LLM unavailable')
  }

  const model = options?.model ?? 'claude-sonnet-4-6'

  // Bankr LLM Gateway — base URL is llm.bankr.bot, auth header is X-API-Key
  const resp = await fetch('https://llm.bankr.bot/v1/chat/completions', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.1,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Bankr API error ${resp.status}: ${err}`)
  }

  const data = await resp.json()

  // Extract cost from usage
  const costUSD = estimateInferenceCost(
    data.usage?.prompt_tokens ?? 0,
    data.usage?.completion_tokens ?? 0,
    model
  )
  totalInferenceCost += costUSD

  return {
    id: data.id,
    model: data.model,
    content: data.choices?.[0]?.message?.content ?? '',
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
      costUSD,
    },
    wallet: {
      balanceUSD: data.wallet?.balance_usd ?? 0,
      balanceETH: data.wallet?.balance_eth ?? '0',
      address: data.wallet?.address ?? '',
    }
  }
}

/**
 * Get Bankr wallet balance
 * This wallet is funded by Inchy's revenue streams
 */
export async function getBankrWalletBalance(): Promise<{
  balanceUSD: number
  balanceETH: string
  address: string
}> {
  const apiKey = process.env.BANKR_API_KEY
  if (!apiKey) return { balanceUSD: 0, balanceETH: '0', address: '' }

  try {
    const resp = await fetch('https://llm.bankr.bot/v1/wallet', {
      headers: { 'X-API-Key': apiKey }
    })
    if (!resp.ok) throw new Error('Bankr wallet fetch failed')
    const data = await resp.json()
    return {
      balanceUSD: data.balance_usd ?? 0,
      balanceETH: data.balance_eth ?? '0',
      address: data.address ?? '',
    }
  } catch {
    return { balanceUSD: 0, balanceETH: '0', address: '' }
  }
}

/**
 * Record a revenue event — Inchy earns this from user activity
 * These revenues are what fund the agent's inference costs
 */
export function recordRevenue(event: Omit<RevenueEvent, 'timestamp'>): void {
  const full: RevenueEvent = { ...event, timestamp: new Date().toISOString() }
  revenueLog.push(full)
  totalRevenue += event.amountUSD
  console.log(`[Bankr] Revenue recorded: +$${event.amountUSD} from ${event.source}`)
}

/**
 * Get the agent's economic health status
 * Shows whether inference is truly self-funded from revenue
 */
export async function getAgentEconomics(): Promise<AgentEconomics> {
  const wallet = await getBankrWalletBalance()
  const isSelfsustaining = totalRevenue >= totalInferenceCost && totalRevenue > 0

  return {
    revenueEarnedUSD: totalRevenue,
    inferenceCostUSD: totalInferenceCost,
    netProfitUSD: totalRevenue - totalInferenceCost,
    walletBalanceUSD: wallet.balanceUSD,
    walletAddress: wallet.address,
    isSelfsustaining,
    inferencesFundedByRevenue: totalRevenue > 0
      ? Math.floor(totalRevenue / Math.max(totalInferenceCost, 0.001))
      : 0,
  }
}

/**
 * AI-powered portfolio analysis — paid for by swap fees
 * The revenue from the swap that just happened funds this analysis
 */
export async function analyzePortfolioWithBankr(
  portfolioData: object,
  userPrompt: string,
  swapFeeRevenue?: number
): Promise<string> {
  // Record revenue if this was triggered by a swap
  if (swapFeeRevenue && swapFeeRevenue > 0) {
    recordRevenue({ source: 'swap_fee', amountUSD: swapFeeRevenue })
  }

  const messages: BankrMessage[] = [
    {
      role: 'system',
      content: `You are Inchy, an autonomous AI crypto asset manager. You analyze DeFi portfolios and provide actionable yield optimization recommendations.
      
Key constraints:
- Only recommend strategies you can actually execute (Lido staking, Uniswap swaps, Base yield)
- Always mention estimated APY and risk level
- Be concise and specific — no generic advice
- Your inference is funded by the revenue you help generate`
    },
    {
      role: 'user',
      content: `Portfolio data: ${JSON.stringify(portfolioData, null, 2)}\n\nUser question: ${userPrompt}`
    }
  ]

  const result = await callBankrLLM(messages, { model: 'claude-sonnet-4-6', maxTokens: 512 })
  return result.content
}

/**
 * Autonomous yield strategy decision
 * Agent decides whether to stake, swap, or hold — funded by yield itself
 */
export async function makeYieldDecision(params: {
  portfolioValue: number
  currentYield: number
  availableStrategies: Array<{ name: string; apy: number; risk: string }>
  yieldRevenue: number
}): Promise<{
  decision: string
  action: 'stake' | 'swap' | 'hold' | 'rebalance'
  targetProtocol?: string
  reasoning: string
}> {
  // Yield from Lido funds this inference call
  if (params.yieldRevenue > 0) {
    recordRevenue({ source: 'yield', amountUSD: params.yieldRevenue })
  }

  const messages: BankrMessage[] = [
    {
      role: 'system',
      content: 'You are an autonomous DeFi yield optimizer. Respond with JSON only. Format: {"decision": "...", "action": "stake|swap|hold|rebalance", "targetProtocol": "...", "reasoning": "..."}'
    },
    {
      role: 'user',
      content: JSON.stringify(params)
    }
  ]

  const result = await callBankrLLM(messages, { model: 'claude-sonnet-4-6', maxTokens: 256, temperature: 0 })

  try {
    return JSON.parse(result.content)
  } catch {
    return {
      decision: result.content,
      action: 'hold',
      reasoning: 'Could not parse structured response',
    }
  }
}

/**
 * Estimate inference cost for given token usage
 * Used to track self-funding economics
 */
function estimateInferenceCost(
  promptTokens: number,
  completionTokens: number,
  model: string
): number {
  // Approximate pricing per 1M tokens
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  }
  const p = pricing[model] ?? { input: 3.0, output: 15.0 }
  return (promptTokens * p.input + completionTokens * p.output) / 1_000_000
}

export function getRevenueLog(): RevenueEvent[] {
  return revenueLog
}

export function resetEconomics(): void {
  revenueLog = []
  totalRevenue = 0
  totalInferenceCost = 0
}
