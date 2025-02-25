// "use client"

// import { Bot, ArrowRight, Settings2 } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import Link from "next/link"

// const suggestions = [
//   {
//     text: "Based on your ETH holdings, you might want to consider staking on Lido for passive income",
//     action: "Stake ETH",
//   },
//   {
//     text: "Your wallet shows high gas spending. Consider using Layer 2 solutions like Arbitrum",
//     action: "Bridge to L2",
//   },
//   {
//     text: "NFT trading volume is up 25% this week. Good time to list your collections",
//     action: "List NFTs",
//   },
// ]

// export function AiActions() {
//   return (
//     <Card className="bg-[#181c1f] border-gray-800 text-white w-[90%] mt-[60px] rounded-xl">
//       <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
//         <div className="flex items-center gap-2">
//           <Bot className="h-4 w-4 text-zinc-200" />
//           <CardTitle className="text-base font-medium">AI Actions</CardTitle>

//         </div>
//         <Link href="/dashboard/ai-settings" className="text-sm flex">
//          <div>AI Setting </div> 
//            <Settings2 className="h-4 w-4 text-zinc-200"/>
          
//           </Link>
         
//       </CardHeader>
//       <CardContent className="space-y-3">
//         {suggestions.map((suggestion, index) => (
//           <div key={index} className="rounded-lg bg-gray-800/50 p-4 transition-colors hover:bg-gray-800">
//             <div className="flex items-start justify-between gap-4">
//               <p className="text-sm text-gray-400">{suggestion.text}</p>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="shrink-0 text-zinc-200 hover:text-purple-300 hover:bg-zink-400/10"
//               >
//                 {suggestion.action}
//                 <ArrowRight className="ml-2 h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         ))}
//       </CardContent>
//     </Card>
//   )
// }





"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings2, ArrowRight, Rocket, Wallet, BracketsIcon as Bridge, Image } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface Action {
  id: string
  title: string
  description: string
  action: string
  icon: React.ReactNode
  stats: string
  estimate: string
}

const actions: Action[] = [
  {
    id: "stake",
    title: "Stake ETH",
    description: "Based on your ETH holdings, you might want to consider staking on Lido for passive income",
    action: "Stake ETH",
    icon: <Wallet className="w-8 h-8 text-blue-500" />,
    stats: "~4.8% APR",
    estimate: "Est. $420/year",
  },
  {
    id: "bridge",
    title: "Bridge to L2",
    description: "Your wallet shows high gas spending. Consider using Layer 2 solutions like Arbitrum",
    action: "Bridge to L2",
    icon: <Bridge className="w-8 h-8 text-purple-500" />,
    stats: "Save 82% on gas",
    estimate: "Est. $123 saved/month",
  },
  {
    id: "nft",
    title: "List NFTs",
    description: "NFT trading volume is up 25% this week. Good time to list your collections",
    action: "List NFTs",
    icon: <Image className="w-8 h-8 text-green-500" />,
    stats: "+25% volume",
    estimate: "Floor up 12% this week",
  },
]

export function AiActions() {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const executeAction = async (actionId: string) => {
    setExecutingAction(actionId)
    setProgress(0)

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setProgress(i)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    setExecutingAction(null)
    setProgress(0)
    setIsDialogOpen(false)
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-[400px] bg-[#111111]/90 border-gray-800/50 backdrop-blur-xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <div className="flex items-center space-x-2">
              <Rocket className="w-4 h-4 text-blue-500" />
              <span className="text-gray-200 font-medium">AI Actions</span>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-200 relative">
              <Settings2 className="h-4 w-4" />
              <span className="sr-only">AI Settings</span>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 relative">
            <AnimatePresence>
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 w-full p-4 text-left rounded-lg bg-gradient-to-br from-gray-900/50 to-gray-800/50 hover:from-gray-800/50 hover:to-gray-700/50 transition-all duration-300 group relative overflow-hidden"
                  onClick={() => {
                    setSelectedAction(action)
                    setIsDialogOpen(true)
                  }}
                >
                  <div className="shrink-0">{action.icon}</div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm text-gray-400 leading-relaxed">{action.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-200 flex items-center gap-2">
                        {action.action}
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                      </p>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-400">{action.stats}</p>
                        <p className="text-xs text-gray-500">{action.estimate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </motion.button>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#111111] border-gray-800 text-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction?.icon}
              <span>{selectedAction?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-900/50 space-y-2">
              <div className="text-sm text-gray-400">{selectedAction?.description}</div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-medium">{selectedAction?.stats}</span>
                <span className="text-gray-500 text-sm">{selectedAction?.estimate}</span>
              </div>
            </div>

            <div className="space-y-4">
              <motion.div
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Autopilot</div>
                  <div className="text-xs text-gray-400">Automatically execute this action when conditions are met</div>
                </div>
                <Switch />
              </motion.div>

              <motion.div
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-500/5 hover:from-purple-500/20 hover:to-purple-500/10 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Copilot</div>
                  <div className="text-xs text-gray-400">Get notifications when this action is recommended</div>
                </div>
                <Switch />
              </motion.div>
            </div>

            {executingAction === selectedAction?.id ? (
              <div className="space-y-2">
                <Progress value={progress} className="h-1 bg-gray-800" />
                <p className="text-sm text-center text-gray-400">
                  {progress < 100 ? "Executing action..." : "Complete!"}
                </p>
              </div>
            ) : (
              <motion.button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-2 rounded-lg font-medium transition-all duration-300"
                onClick={() => selectedAction && executeAction(selectedAction.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Execute Action
              </motion.button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

