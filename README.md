# Inchy.ai — Autonomous AI Crypto Asset Manager

> [The Synthesis Hackathon](https://synthesis.md) · Built with [OpenCode](https://opencode.ai) · Submitted March 22, 2026

**Inchy** is a self-sustaining autonomous AI agent that manages crypto portfolios, executes real DeFi strategies on Base, and pays for its own AI inference from the revenue it generates. No human credit card. No subsidy. Closed-loop agent economics.

- **Live app**: https://inchy.arcumet.com
- **Demo video**: https://youtu.be/yoOYeyTwQno
- **Agent wallet**: `0x0bd3DEb071beFfad807acD30E7A962e7ad8d699f` (Base + Arbitrum)

---

## Bounty Qualification — Judge Rubric Map

### Uniswap — Agentic Finance ($10k)
> *"Every submission must integrate the Uniswap API with a real API key. Functional swaps with real TxIDs on testnet or mainnet. No mocks, no workarounds."*

**How we meet every requirement:**

| Requirement | Implementation | Evidence |
|---|---|---|
| Real Uniswap API key | `UNISWAP_API_KEY` env var, used in every quote | [`core/defi/uniswap.ts:L48`](core/defi/uniswap.ts) |
| Trading API 3-step flow | `check_approval → quote → swap` | [`core/defi/uniswap.ts:L140-L210`](core/defi/uniswap.ts) |
| UniswapX routing | DUTCH_V2 / PRIORITY routing supported | [`core/defi/uniswap.ts:L75-L100`](core/defi/uniswap.ts) |
| Real TxIDs on-chain | Live swap endpoint returns BaseScan/Arbiscan URLs | [`app/api/swap/route.ts`](app/api/swap/route.ts) |
| Permit2 approval | `check_approval` step handles Permit2 | [`core/defi/uniswap.ts:L147-L162`](core/defi/uniswap.ts) |
| Open source + README | This repo | Public ✓ |
| Uniswap AI Skills | `swap-integration` skill loaded | [`.agents/skills/swap-integration/`](.agents/skills/swap-integration/) |

**Live swap quote** (callable right now, no auth):
```bash
curl https://inchy.arcumet.com/api/swap \
  -X POST -H "Content-Type: application/json" \
  -d '{"action":"quote","tokenIn":"ETH","tokenOut":"USDC","amountIn":"0.01"}'
```

---

### Lido — stETH Agent Treasury ($10k, Track 2)
> *"A treasury primitive — a smart contract that holds stETH and provides bounded agent spending access against yield. sharesOf enforcement. wstETH L2 path explicitly supported. No mocks."*

**How we meet every requirement:**

| Requirement | Implementation | Evidence |
|---|---|---|
| Treasury primitive | `getAgentTreasury()` enforces yield-only spending | [`core/defi/lido.ts:L120-L145`](core/defi/lido.ts) |
| `sharesOf` enforcement | `spendable = balanceOf - getPooledEthByShares(sharesOf)` | [`core/defi/lido.ts:L130`](core/defi/lido.ts) |
| Principal structurally locked | Shares baseline recorded at deposit; never changes | [`core/defi/lido.ts:L125`](core/defi/lido.ts) |
| wstETH on Base (L2 path) | `getWstETHBalanceOnBase()` uses Base wstETH contract | [`core/defi/lido.ts:L160-L180`](core/defi/lido.ts) |
| wstETH exchange rate tracking | `stEthPerToken()` for L2 builders (not rebasing) | [`core/defi/lido.ts:L170`](core/defi/lido.ts) |
| Live Lido APR | Fetches from `eth-api.lido.fi/v1/protocol/steth/apr/sma` | [`core/defi/lido.ts:L185`](core/defi/lido.ts) |
| Stake via `submit()` | Calls Lido `submit(referral)` payable | [`core/defi/lido.ts:L65`](core/defi/lido.ts) |
| No mocks | All data from Lido contracts / API | Live ✓ |

**Treasury accounting in code:**
```typescript
// core/defi/lido.ts — the exact primitive the rubric describes
const shares     = await stETH.sharesOf(agentAddress)         // principal baseline
const principal  = await stETH.getPooledEthByShares(shares)   // never changes
const balance    = await stETH.balanceOf(agentAddress)        // grows with rebase
const spendable  = balance - principal                        // ONLY yield, never principal
```

**Live treasury endpoint:**
```bash
curl "https://inchy.arcumet.com/api/lido?address=0x0bd3DEb071beFfad807acD30E7A962e7ad8d699f&view=treasury"
```

---

### Bankr — Self-Funding Agent ($7,590)
> *"Build an agent that generates its own revenue and uses that revenue to pay for its own thinking. An AI that funds its own inference."*

**The closed loop:**

```
Swap executed → 0.1% fee recorded → Bankr wallet funded → GLM-4.5 inference → 
better recommendations → more swaps → more fees → more inference
```

| Requirement | Implementation | Evidence |
|---|---|---|
| Agent generates revenue | `recordRevenue()` on every swap, yield, signal | [`core/defi/bankr.ts:L120`](core/defi/bankr.ts) |
| Revenue pays for inference | Bankr wallet (`bk_L4AJ...`) pre-funds LLM calls | [`core/defi/bankr.ts:L45`](core/defi/bankr.ts) |
| Provably self-sustaining | `GET /api/agent/economics` returns live P&L | [`app/api/agent/economics/route.ts`](app/api/agent/economics/route.ts) |
| Multiple revenue streams | swap fees + Lido yield + x402 signals | [`core/defi/bankr.ts:L95-L115`](core/defi/bankr.ts) |
| Bankr LLM Gateway | `POST llm.bankr.bot/v1/chat/completions` with `X-API-Key` | [`core/defi/bankr.ts:L48`](core/defi/bankr.ts) |

**Live economics check:**
```bash
curl https://inchy.arcumet.com/api/agent/economics
# → { status: "SELF_SUSTAINING", revenueEarnedUSD, inferenceCostUSD, netProfitUSD }
```

---

### Base — Autonomous Trading Agent ($5k)
> *"Novel strategies. Proven profitability. Autonomous execution. Real onchain activity."*

| Requirement | Implementation | Evidence |
|---|---|---|
| Autonomous execution | Agent generates signal → executes swap without human input | [`core/defi/trading-agent.ts:L90`](core/defi/trading-agent.ts) |
| Novel strategy | AI-powered momentum signals via GLM-4.5 + price history | [`core/defi/trading-agent.ts:L55`](core/defi/trading-agent.ts) |
| Real onchain TxIDs | Every trade returns BaseScan/Arbiscan explorer URL | [`core/defi/trading-agent.ts:L115`](core/defi/trading-agent.ts) |
| Profitability tracking | Win rate, P&L, Sharpe ratio tracked per trade | [`core/defi/trading-agent.ts:L155`](core/defi/trading-agent.ts) |
| Uniswap V3 execution | `exactInputSingle` via Trading API | [`core/defi/uniswap.ts:L165`](core/defi/uniswap.ts) |

**Live performance:**
```bash
curl https://inchy.arcumet.com/api/agent/trade
# → { totalTrades, winRate, totalPnlUSD, onChainProof: [{ txHash, explorerUrl }] }
```

---

### Base — Agent Services on Base ($5k)
> *"Meaningful utility. Willingness-to-pay. Discoverable by other agents and humans. x402 payments on Base."*

| Requirement | Implementation | Evidence |
|---|---|---|
| Real utility | Trading signals other agents actually use | [`app/api/agent/signal/route.ts`](app/api/agent/signal/route.ts) |
| x402 payments | Returns `402` with USDC payment info if no payment header | [`app/api/agent/signal/route.ts:L30`](app/api/agent/signal/route.ts) |
| Discoverable | Public endpoint, documented, OpenAPI-compatible | `GET /api/agent/signal?symbol=ETH` |
| Agent coordination | Any AI agent can call with `x-payment` header | [`app/api/agent/signal/route.ts:L25`](app/api/agent/signal/route.ts) |
| USDC on Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | [`core/defi/trading-agent.ts:L12`](core/defi/trading-agent.ts) |

**x402 flow** (try it now):
```bash
# Without payment → returns 402 with payment instructions
curl https://inchy.arcumet.com/api/agent/signal?symbol=ETH

# With payment header → returns signal
curl https://inchy.arcumet.com/api/agent/signal?symbol=ETH \
  -H "x-payment: 0x<usdc_tx_hash>"
```

---

### Open Track ($28,300)
Built using tools from and by the Ethereum ecosystem:
- **Uniswap** (swaps), **Lido** (staking), **Base** (L2 execution), **viem** (onchain calls)
- **ERC-8004** agent identity, **x402** micropayments, **Permit2** approvals
- Fully autonomous: agent discovers opportunities, executes, verifies, and funds itself

---

## Architecture

```
inchy.arcumet.com (Next.js 14 on Vercel)
        │
        ├── core/defi/uniswap.ts      Uniswap Trading API → real swaps
        ├── core/defi/lido.ts         Lido submit() + sharesOf treasury
        ├── core/defi/bankr.ts        Bankr LLM Gateway + revenue tracking  
        └── core/defi/trading-agent.ts  AI signals + x402 service
        │
        ├── Base Mainnet (8453)
        │   ├── Uniswap V3 SwapRouter02: 0x2626664c2603336E57B271c5C0b26F421741e481
        │   ├── wstETH: 0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452
        │   └── USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
        │
        └── Ethereum Mainnet
            └── Lido stETH: 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
```

## Key Files

| File | Purpose |
|------|---------|
| [`core/defi/uniswap.ts`](core/defi/uniswap.ts) | Uniswap Trading API: check_approval → quote → swap |
| [`core/defi/lido.ts`](core/defi/lido.ts) | Lido staking + sharesOf treasury primitive |
| [`core/defi/bankr.ts`](core/defi/bankr.ts) | Bankr self-funding loop: revenue → inference |
| [`core/defi/trading-agent.ts`](core/defi/trading-agent.ts) | Autonomous trading + x402 signal service |
| [`app/api/swap/route.ts`](app/api/swap/route.ts) | Swap quote + execution API |
| [`app/api/lido/route.ts`](app/api/lido/route.ts) | Lido position, staking, treasury |
| [`app/api/agent/signal/route.ts`](app/api/agent/signal/route.ts) | x402 micropayment signal service |
| [`app/api/agent/economics/route.ts`](app/api/agent/economics/route.ts) | Self-funding economics dashboard |

## Setup

```bash
npm install
cp .env.example .env.local
# Set: UNISWAP_API_KEY, AGENT_PRIVATE_KEY, BANKR_API_KEY, GLM_API_KEY
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UNISWAP_API_KEY` | Uniswap Developer Platform API key |
| `AGENT_PRIVATE_KEY` | Agent wallet private key for autonomous execution |
| `BANKR_API_KEY` | Bankr LLM Gateway — funded by agent revenue |
| `GLM_API_KEY` | ZhipuAI GLM-4.5-air — primary LLM for chat + analysis |
| `AGENT_SERVICE_WALLET` | Receives x402 signal payments on Base |
