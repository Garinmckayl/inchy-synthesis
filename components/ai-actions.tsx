"use client"

import { Bot, ArrowRight, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const suggestions = [
  {
    text: "Based on your ETH holdings, you might want to consider staking on Lido for passive income",
    action: "Stake ETH",
  },
  {
    text: "Your wallet shows high gas spending. Consider using Layer 2 solutions like Arbitrum",
    action: "Bridge to L2",
  },
  {
    text: "NFT trading volume is up 25% this week. Good time to list your collections",
    action: "List NFTs",
  },
]

export function AiActions() {
  return (
    <Card className="bg-[#181c1f] border-gray-800 text-white">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-400" />
          <CardTitle className="text-base font-medium">AI Actions</CardTitle>
          <Link href="/dashboard/ai-settings">

          <Settings2 className="h-4 w-4 text-purple-400"/>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="rounded-lg bg-gray-800/50 p-4 transition-colors hover:bg-gray-800">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-gray-400">{suggestion.text}</p>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
              >
                {suggestion.action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

