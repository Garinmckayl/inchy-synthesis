# Inchy.ai — Autonomous AI Crypto Asset Manager

> Built for [The Synthesis Hackathon](https://synthesis.md) · Deadline: March 22, 2026

Inchy is a **self-sustaining autonomous AI agent** that manages crypto portfolios, executes real DeFi strategies, and pays for its own AI inference using the revenue it generates.

## Live Demo

- **App**: https://inchycrypto.vercel.app
- **Swap API**: `GET /api/swap`
- **Signal Service (x402)**: `GET /api/agent/signal?symbol=ETH`
- **Agent Economics**: `GET /api/agent/economics`
- **Lido Treasury**: `GET /api/lido`

---

## What It Does

### 1. Real Uniswap V3 Swaps on Base
- Uses Uniswap Developer Platform API + on-chain QuoterV2 fallback
- `exactInputSingle` swaps with Permit2 approval
- Real transaction receipts on Base mainnet
- Supports ETH, WETH, USDC, DAI, cbETH

```bash
# Get a swap quote
curl -X POST /api/swap -d '{"action":"quote","tokenIn":"ETH","tokenOut":"USDC","amountIn":"0.01"}'

# Execute a swap (requires AGENT_PRIVATE_KEY)
curl -X POST /api/swap -d '{"action":"execute","tokenIn":"ETH","tokenOut":"USDC","amountIn":"0.01","recipient":"0x..."}'
```

### 2. Lido stETH Yield Treasury
- Stakes ETH → receives stETH (rebasing yield token)
- **Agent treasury primitive**: only stETH yield (rebase) is spendable; principal is structurally locked via `sharesOf` accounting
- Tracks `yieldETH = balanceOf(agent) - getPooledEthByShares(sharesOf(agent))`
- Also supports wstETH on Base (bridged)

```bash
# Get Lido position + treasury status
GET /api/lido?address=0x...&view=treasury

# Stake ETH with Lido
POST /api/lido {"action":"stake","amountEth":"0.1","address":"0x..."}
```

### 3. Bankr Self-Funding Agent
- Every swap/strategy fee is recorded as revenue
- Revenue flows to the Bankr wallet
- LLM inference (portfolio analysis, trade signals) is paid from that wallet
- Agent is **economically self-sustaining**: revenue ≥ inference costs

```bash
# Check agent economics
GET /api/agent/economics
# → { status: "SELF_SUSTAINING", revenueEarnedUSD: ..., inferenceCostUSD: ..., netProfitUSD: ... }
```

### 4. Autonomous Trading Agent on Base
- Momentum-based strategy using AI signals (via Bankr LLM Gateway)
- Real execution via Uniswap V3 on Base
- On-chain proof: all trades have BaseScan TxIDs
- Performance tracking: win rate, P&L, Sharpe ratio

### 5. x402 Agent Service (Agent Services on Base)
- Any AI agent can call `GET /api/agent/signal?symbol=ETH`
- Service returns trading signals for 0.001 USDC via x402 micropayments
- Real Base/USDC payments, fully autonomous
- Discoverable by other agents

---

## Bounties Targeted

| Bounty | How We Qualify |
|--------|---------------|
| **Uniswap — $10k** | Real swaps on Base via Uniswap V3 API, on-chain TxIDs, Permit2 |
| **Lido — $10k** | stETH yield treasury primitive + wstETH Base + vault monitor |
| **Bankr — $7.5k** | Swap fees → Bankr wallet → inference costs; provably self-sustaining |
| **Base Trading — $5k** | Autonomous agent, real trades, on-chain receipts, P&L tracking |
| **Base Service — $5k** | x402 signal API, 0.001 USDC per call, discoverable by agents |
| **Open Track — $28k** | Full stack: Ethereum ecosystem, autonomous, on-chain identity |

---

## Architecture

```
User / Agent Request
        ↓
  Inchy Next.js App
        ↓
  ┌─────────────────────────────────┐
  │  core/defi/uniswap.ts           │ ← real swaps, quotes, price feeds
  │  core/defi/lido.ts              │ ← stake ETH, treasury primitive
  │  core/defi/bankr.ts             │ ← self-funding LLM gateway
  │  core/defi/trading-agent.ts     │ ← autonomous trading + x402
  └─────────────────────────────────┘
        ↓
  Base Mainnet (8453)
  ├── Uniswap V3 SwapRouter02
  ├── wstETH (bridged from Lido)
  └── USDC (x402 payments)
  
  Ethereum Mainnet
  └── Lido stETH contract
```

## Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, Radix UI, Recharts
- **Blockchain**: viem, ethers.js, wagmi
- **DeFi**: Uniswap V3/V4 (Base), Lido (Ethereum + Base)
- **AI**: Bankr LLM Gateway (self-funding), Vercel AI SDK
- **Auth**: Privy
- **Wallet**: ERC-8004 on-chain identity (Base)
- **Payment**: x402 micropayments (USDC on Base)

## Setup

```bash
# Install
yarn install

# Environment variables
cp .env.example .env.local
# Set: UNISWAP_API_KEY, AGENT_PRIVATE_KEY, BANKR_API_KEY

# Run
yarn dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `UNISWAP_API_KEY` | Uniswap Developer Platform API key |
| `AGENT_PRIVATE_KEY` | Agent wallet private key for autonomous execution |
| `BANKR_API_KEY` | Bankr LLM Gateway key (agent's inference wallet) |
| `AGENT_WALLET_ADDRESS` | Agent's ERC-8004 registered Base wallet |
| `AGENT_SERVICE_WALLET` | Wallet that receives x402 signal payments |

## Agent Identity (ERC-8004)

- **Agntor**: `0x0bd3DEb071beFfad807acD30E7A962e7ad8d699f` (Base Mainnet)
- **Inchy Agent**: registered at The Synthesis Hackathon

---

Built with [OpenCode](https://opencode.ai) · [The Synthesis Hackathon](https://synthesis.md)
