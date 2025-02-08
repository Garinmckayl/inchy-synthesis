"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share, LayoutGrid, List, ChevronDown } from "lucide-react"

export function ActivityFeed() {
  return (
    <Card className="bg-[#181c1f] border-gray-800 text-white p-4 border rounded-lg" >
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium">Activity</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex">
            <Button variant="outline" size="icon" className="rounded-r-none border-r-0">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-l-none">
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            Filter By Token
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Last Received</h3>
          <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-500">
            View all
          </Button>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-gray-800/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔷</span>
              <span>0.00001 ETH</span>
            </div>
            <span className="text-sm text-gray-400">4 days ago</span>
          </div>
          <div className="rounded-lg bg-gray-800/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-green-400" />
                <span>0xf39f...2266</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              <div>3 days ago</div>
              <div className="mt-1">
                Sent <span className="text-xl align-middle">🔷</span> {"<0.00001 ETH"}
                <span className="text-gray-500"> to </span>
                <span className="text-blue-500">0x246c...6720</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

