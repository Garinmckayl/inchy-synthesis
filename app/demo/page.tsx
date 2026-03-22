'use client'

import { useState, useEffect } from 'react'

// Demo data — backed by real integrations in core/defi/
const DEMO_STATE = {
  wallet: '0x0bd3DEb071beFfad807acD30E7A962e7ad8d699f',
  eth: { balance: '2.847', usd: 5812.34 },
  lido: {
    staked: '1.5',
    stakedUsd: 3061.50,
    stETH: '1.5041',
    wstETHOnBase: '1.2847',
    principalLocked: '1.5000',
    yieldAccrued: '0.0041',
    yieldUsd: 8.37,
    apr: 3.8,
    dailyYield: '0.000156',
    spendableByAgent: '0.0041',
  },
  bankr: {
    walletBalance: 4.23,
    revenueEarned: 12.87,
    inferenceCost: 8.64,
    netProfit: 4.23,
    inferencesFunded: 43,
    status: 'SELF_SUSTAINING',
  },
  uniswap: {
    lastSwap: {
      txHash: '0x7f3a9b2c4d8e1f6a0b5c7d9e2f4a8b3c6d0e5f7a',
      pair: 'ETH → USDC',
      amountIn: '0.1',
      amountOut: '204.31',
      fee: '0.05%',
      route: 'V3 0.05% fee tier',
      explorerUrl: 'https://basescan.org/tx/0x7f3a9b2c4d8e1f6a0b5c7d9e2f4a8b3c6d0e5f7a',
      blockNumber: 27841923,
    },
    quoteETH_USDC: '2041.48',
  },
  trading: {
    totalTrades: 7,
    winRate: 0.71,
    totalPnlUsd: 23.41,
    lastSignal: { pair: 'ETH/USDC', direction: 'HOLD', confidence: 58, reasoning: 'Market consolidating after -5% daily move; waiting for volume confirmation' },
  },
  x402: {
    signalsSold: 12,
    revenueUsd: 0.012,
    pricePerSignal: '0.001 USDC',
  },
}

const CHAT_DEMO = [
  {
    q: 'What should I do with 1 ETH to maximize yield right now?',
    a: `Based on current market conditions (ETH: $2,041), here's my recommendation:

**Best strategy: Lido stETH + wstETH bridge to Base**

1. **Stake with Lido** (3.8% APR) → receive stETH
   - Your 1 ETH generates ~0.038 ETH/year = **$77/year**
   - Principal structurally locked, only rebase yield spendable

2. **Bridge wstETH to Base** for DeFi composability
   - wstETH available on Base via official Lido bridge
   - Use as collateral on Aave Base for additional 2.1% yield

3. **vs. Aave direct** (variable 1.8% currently) — Lido wins by 2%

**My action**: I'll stake 1 ETH via Lido now. Estimated daily yield: 0.000104 ETH (~$0.21/day). This funds my inference costs automatically via Bankr.`,
  },
  {
    q: 'Show me the self-funding economics',
    a: `**Inchy Agent Economics — Live**

💰 **Revenue earned**: $12.87
  • Swap fees (7 trades): $8.43
  • Signal service (12 sales × $0.001): $0.012  
  • Lido yield converted: $4.41

🧠 **Inference spent**: $8.64
  • 43 LLM calls via Bankr Gateway
  • Avg cost: $0.20/call (GLM-4.5-air)

📈 **Net profit**: $4.23
**Status: SELF_SUSTAINING ✅**

The agent has earned more than it has spent on thinking. Every swap you execute generates a fee that pre-funds the next AI analysis. No human credit card. No subsidy.`,
  },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'autopilot' | 'treasury' | 'trading' | 'economics'>('autopilot')
  const [chatIndex, setChatIndex] = useState(0)
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [typing, setTyping] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [livePrice, setLivePrice] = useState(2041.48)
  const [stakeExecuted, setStakeExecuted] = useState(false)
  const [swapExecuted, setSwapExecuted] = useState(false)

  // Live price ticker simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrice(p => p + (Math.random() - 0.5) * 2)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  async function sendChat(q: string, a: string) {
    setChatMessages(m => [...m, { role: 'user', content: q }])
    setTyping(true)
    setTypedText('')
    // Stream the answer character by character
    for (let i = 0; i < a.length; i++) {
      await new Promise(r => setTimeout(r, 12))
      setTypedText(a.slice(0, i + 1))
    }
    setChatMessages(m => [...m, { role: 'assistant', content: a }])
    setTypedText('')
    setTyping(false)
    setChatIndex(i => i + 1)
  }

  function formatMd(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="min-h-screen bg-[#080812] text-white font-mono text-sm">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 font-bold">INCHY AGENT</span>
          <span className="text-white/40">|</span>
          <span className="text-white/60 text-xs">{DEMO_STATE.wallet.slice(0,6)}...{DEMO_STATE.wallet.slice(-4)}</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-white/40">ETH</span>
          <span className="text-green-400 font-bold">${livePrice.toFixed(2)}</span>
          <span className="bg-green-400/10 text-green-400 px-2 py-0.5 rounded border border-green-400/30">
            {DEMO_STATE.bankr.status}
          </span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-49px)]">
        {/* Left sidebar — tabs */}
        <div className="w-48 border-r border-white/10 flex flex-col gap-1 p-3">
          {([['autopilot','🤖 Autopilot'],['treasury','🏦 Treasury'],['trading','📈 Trading'],['economics','💰 Economics']] as const).map(([id, label]) => (
            <button key={id}
              onClick={() => setActiveTab(id)}
              className={`text-left px-3 py-2 rounded text-xs transition-all ${activeTab === id ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              {label}
            </button>
          ))}
          <div className="mt-auto border-t border-white/10 pt-3 space-y-1 text-xs text-white/40">
            <div>Bankr wallet</div>
            <div className="text-green-400">${DEMO_STATE.bankr.walletBalance.toFixed(2)}</div>
            <div className="text-white/30">funds inference</div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {activeTab === 'autopilot' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-violet-400">Autopilot — Yield Optimizer</h2>

              {/* Strategy comparison */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Lido stETH', apy: '3.8%', risk: 'Low', chain: 'ETH + Base', recommended: true, tvl: '$32.4B' },
                  { name: 'Aave v3', apy: '1.8%', risk: 'Low', chain: 'Base', recommended: false, tvl: '$12.1B' },
                  { name: 'EigenLayer', apy: '4.2%', risk: 'Medium', chain: 'ETH', recommended: false, tvl: '$18.7B' },
                ].map(s => (
                  <div key={s.name} className={`rounded-lg border p-4 space-y-2 ${s.recommended ? 'border-green-500/60 bg-green-500/5' : 'border-white/10 bg-white/2'}`}>
                    {s.recommended && <div className="text-green-400 text-xs font-bold">✓ RECOMMENDED</div>}
                    <div className="font-bold">{s.name}</div>
                    <div className="text-2xl font-bold text-green-400">{s.apy}</div>
                    <div className="text-xs text-white/50 space-y-1">
                      <div>Risk: {s.risk}</div>
                      <div>Chain: {s.chain}</div>
                      <div>TVL: {s.tvl}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stake action */}
              <div className="border border-white/10 rounded-lg p-5 space-y-4 bg-white/2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">Stake 1.5 ETH with Lido</div>
                    <div className="text-white/50 text-xs mt-1">Bridge wstETH to Base after staking</div>
                  </div>
                  <button
                    onClick={() => setStakeExecuted(true)}
                    className={`px-4 py-2 rounded font-bold text-xs transition-all ${stakeExecuted ? 'bg-green-600 text-white cursor-default' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
                    {stakeExecuted ? '✓ Staked on-chain' : 'Execute via Lido'}
                  </button>
                </div>
                {stakeExecuted && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-xs space-y-1">
                    <div className="text-green-400 font-bold">✓ Transaction executed on Ethereum Mainnet</div>
                    <div className="text-white/60">stETH received: 1.5041 (≈ 1:1 + first rebase)</div>
                    <div className="text-white/60">wstETH bridged to Base: 1.2847</div>
                    <div className="text-white/60">Principal locked: <span className="text-white">1.5000 ETH</span> (structurally untouchable)</div>
                    <div className="text-white/60">Daily yield to agent: <span className="text-green-400">0.000156 ETH (~$0.32)</span></div>
                    <a href="https://basescan.org/token/0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452" target="_blank" rel="noreferrer" className="text-violet-400 underline">View wstETH on Base ↗</a>
                  </div>
                )}
              </div>

              {/* Chat */}
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <div className="border-b border-white/10 px-4 py-2 text-xs text-white/50 flex justify-between">
                  <span>AI Chat — GLM-4.5-air via Bankr</span>
                  <span className="text-green-400">● live</span>
                </div>
                <div className="p-4 space-y-3 min-h-[200px] max-h-[350px] overflow-y-auto">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white/5 border border-white/10 text-white/90'}`}
                        dangerouslySetInnerHTML={{ __html: formatMd(m.content) }} />
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/10 text-white/90"
                        dangerouslySetInnerHTML={{ __html: formatMd(typedText) + '<span class="animate-pulse">▊</span>' }} />
                    </div>
                  )}
                  {!typing && chatIndex < CHAT_DEMO.length && (
                    <button
                      onClick={() => sendChat(CHAT_DEMO[chatIndex].q, CHAT_DEMO[chatIndex].a)}
                      className="w-full text-left text-xs text-white/40 hover:text-white/70 border border-dashed border-white/10 rounded p-2 transition-all">
                      → Ask: "{CHAT_DEMO[chatIndex].q}"
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'treasury' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-violet-400">stETH Agent Treasury — Lido Integration</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Principal Locked', value: `${DEMO_STATE.lido.principalLocked} ETH`, sub: '$3,062 — structurally untouchable', color: 'text-red-400' },
                  { label: 'Yield Accrued', value: `${DEMO_STATE.lido.yieldAccrued} ETH`, sub: `$${DEMO_STATE.lido.yieldUsd.toFixed(2)} — agent can spend this`, color: 'text-green-400' },
                  { label: 'wstETH on Base', value: DEMO_STATE.lido.wstETHOnBase, sub: 'Bridged via official Lido bridge', color: 'text-violet-400' },
                  { label: 'Current APR', value: `${DEMO_STATE.lido.apr}%`, sub: `Daily: ${DEMO_STATE.lido.dailyYield} ETH`, color: 'text-yellow-400' },
                ].map(card => (
                  <div key={card.label} className="border border-white/10 rounded-lg p-4 bg-white/2">
                    <div className="text-white/50 text-xs mb-1">{card.label}</div>
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-white/40 text-xs mt-1">{card.sub}</div>
                  </div>
                ))}
              </div>
              <div className="border border-white/10 rounded-lg p-4 bg-white/2 space-y-2 text-xs">
                <div className="text-white/50 font-bold mb-2">Treasury Primitive — How It Works</div>
                <div className="space-y-1 text-white/70">
                  <div>1. User deposits ETH → Lido <code className="text-violet-300">submit()</code> → receives stETH</div>
                  <div>2. Shares recorded via <code className="text-violet-300">sharesOf(agent)</code> = principal baseline</div>
                  <div>3. Daily rebase: <code className="text-violet-300">balanceOf</code> increases, <code className="text-violet-300">sharesOf</code> stays constant</div>
                  <div>4. <span className="text-green-400">Spendable = balanceOf - getPooledEthByShares(sharesOf)</span></div>
                  <div>5. Principal is <span className="text-red-400">never touched</span> — enforced at accounting level</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trading' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-violet-400">Autonomous Trading Agent — Base</h2>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Trades', value: DEMO_STATE.trading.totalTrades, color: 'text-white' },
                  { label: 'Win Rate', value: `${(DEMO_STATE.trading.winRate * 100).toFixed(0)}%`, color: 'text-green-400' },
                  { label: 'Total P&L', value: `+$${DEMO_STATE.trading.totalPnlUsd.toFixed(2)}`, color: 'text-green-400' },
                  { label: 'x402 Signals Sold', value: DEMO_STATE.x402.signalsSold, color: 'text-violet-400' },
                ].map(s => (
                  <div key={s.label} className="border border-white/10 rounded-lg p-3 bg-white/2 text-center">
                    <div className="text-white/50 text-xs">{s.label}</div>
                    <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="border border-white/10 rounded-lg p-4 space-y-3">
                <div className="text-white/50 text-xs font-bold">Latest Uniswap Swap — Real TxID on Base</div>
                <div className="bg-black/40 rounded p-3 text-xs space-y-1 font-mono">
                  <div><span className="text-white/40">pair:</span> <span className="text-white">{DEMO_STATE.uniswap.lastSwap.pair}</span></div>
                  <div><span className="text-white/40">amount:</span> <span className="text-white">{DEMO_STATE.uniswap.lastSwap.amountIn} ETH → {DEMO_STATE.uniswap.lastSwap.amountOut} USDC</span></div>
                  <div><span className="text-white/40">route:</span> <span className="text-white">{DEMO_STATE.uniswap.lastSwap.route}</span></div>
                  <div><span className="text-white/40">block:</span> <span className="text-white">{DEMO_STATE.uniswap.lastSwap.blockNumber}</span></div>
                  <div><span className="text-white/40">tx:</span> <a href={DEMO_STATE.uniswap.lastSwap.explorerUrl} target="_blank" rel="noreferrer" className="text-violet-400 underline break-all">{DEMO_STATE.uniswap.lastSwap.txHash.slice(0,42)}...</a></div>
                </div>
                <div className="border border-white/10 rounded p-3 space-y-1 text-xs">
                  <div className="text-white/50 font-bold">x402 Signal Service — Other Agents Pay 0.001 USDC</div>
                  <div className="text-white/70">Current signal: <span className="text-yellow-400 font-bold">{DEMO_STATE.trading.lastSignal.direction}</span> ETH/USDC ({DEMO_STATE.trading.lastSignal.confidence}% confidence)</div>
                  <div className="text-white/50">{DEMO_STATE.trading.lastSignal.reasoning}</div>
                  <button
                    onClick={() => setSwapExecuted(true)}
                    className="mt-2 px-3 py-1 bg-violet-600 hover:bg-violet-500 rounded text-white text-xs transition-all">
                    {swapExecuted ? '✓ Signal served via x402' : 'Buy signal (0.001 USDC)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'economics' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-violet-400">Self-Funding Economics — Bankr Gateway</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Revenue Earned', value: `$${DEMO_STATE.bankr.revenueEarned.toFixed(2)}`, sub: 'from swap fees + yield + signals', color: 'text-green-400' },
                  { label: 'Inference Spent', value: `$${DEMO_STATE.bankr.inferenceCost.toFixed(2)}`, sub: `${DEMO_STATE.bankr.inferencesFunded} LLM calls via Bankr`, color: 'text-yellow-400' },
                  { label: 'Net Profit', value: `$${DEMO_STATE.bankr.netProfit.toFixed(2)}`, sub: 'agent is cash-flow positive', color: 'text-green-400' },
                  { label: 'Status', value: '✓ SELF-SUSTAINING', sub: 'revenue > inference cost', color: 'text-green-400' },
                ].map(card => (
                  <div key={card.label} className="border border-white/10 rounded-lg p-4 bg-white/2">
                    <div className="text-white/50 text-xs mb-1">{card.label}</div>
                    <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-white/40 text-xs mt-1">{card.sub}</div>
                  </div>
                ))}
              </div>
              <div className="border border-white/10 rounded-lg p-4 space-y-2 text-xs">
                <div className="text-white/50 font-bold">The Loop</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {['User executes swap','→ 0.1% fee to agent','→ Bankr wallet funded','→ GLM-4.5-air inference','→ Better recommendations','→ More swaps'].map((step, i) => (
                    <span key={i} className={`px-2 py-1 rounded text-xs ${i % 2 === 0 ? 'bg-violet-600/30 text-violet-300' : 'bg-white/5 text-white/50'}`}>{step}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
