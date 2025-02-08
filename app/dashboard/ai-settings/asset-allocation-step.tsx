"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, Info, Lock } from "lucide-react"
import { motion } from "framer-motion"

interface Asset {
  id: string
  name: string
  description: string
  allocation: number
  isLocked: boolean
}

const initialAssets: Asset[] = [
  {
    id: "sekoia",
    name: "Sekoia",
    description:
      "Tokens invested in by Sekoia VC, a venture capital firm focused on AI agents and blockchain technology",
    allocation: 14,
    isLocked: false,
  },
  {
    id: "ai-agents",
    name: "AI Agents",
    description:
      "Collection of innovative AI-powered tokens and platforms, featuring autonomous agents, virtual personalities, and AI-driven trading systems",
    allocation: 14,
    isLocked: false,
  },
  {
    id: "memecoins",
    name: "Memecoins",
    description: "High-risk, high-reward tokens driven by community engagement and social media trends",
    allocation: 14,
    isLocked: false,
  },
  {
    id: "l2s",
    name: "L2s",
    description:
      "Comprehensive index of Layer 2 scaling solutions and their native tokens, focusing on Ethereum scaling platforms and emerging L2 ecosystems",
    allocation: 14,
    isLocked: false,
  },
  {
    id: "defi",
    name: "DeFi",
    description:
      "Diversified mix of leading decentralized finance protocols, including lending platforms, DEXes, and yield aggregators",
    allocation: 14,
    isLocked: false,
  },
  {
    id: "bluechips",
    name: "BlueChips",
    description:
      "Collection of established, high market cap cryptocurrencies with proven track records and strong institutional adoption",
    allocation: 15,
    isLocked: false,
  },
  {
    id: "stables",
    name: "Stables",
    description:
      "A curated selection of top stablecoins focused on reliability and market adoption, including both centralized and decentralized options",
    allocation: 15,
    isLocked: false,
  },
]

export default function AssetAllocationStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: () => void
}) {
  const [assets, setAssets] = useState(initialAssets)
  const [expandedId, setExpandedId] = useState<string | null>("sekoia")

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Asset Allocation</h2>
        <p className="text-gray-400">Allocate your portfolio across different asset classes</p>
      </div>

      <div className="space-y-4">
        {assets.map((asset) => (
          <div key={asset.id} className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{asset.name}</span>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">{asset.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${expandedId === asset.id ? "rotate-180" : ""}`}
                  />
                </Button>
              </div>

              {expandedId === asset.id && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Index Allocation</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{asset.allocation}%</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setAssets(assets.map((a) => (a.id === asset.id ? { ...a, isLocked: !a.isLocked } : a)))
                          }
                        >
                          <Lock className={`h-3 w-3 ${asset.isLocked ? "text-[#FFB800]" : "text-gray-400"}`} />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[asset.allocation]}
                      min={0}
                      max={100}
                      step={1}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                      onValueChange={([value]) =>
                        setAssets(assets.map((a) => (a.id === asset.id ? { ...a, allocation: value } : a)))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-gray-800 border-dashed p-4">
          <Button variant="outline" className="w-full">
            Create Custom Index
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          className="bg-gradient-to-r from-[#FFB800] via-[#FF8C42] to-[#FF69B4] hover:opacity-90 text-white"
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  )
}

