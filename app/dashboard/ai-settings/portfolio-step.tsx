"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

export default function PortfolioStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Portfolio Amount</h2>
        <p className="text-gray-400">Set your initial portfolio amount to start AI-powered asset management</p>
      </div>

      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              className="pl-8 bg-gray-800/50 border-gray-700"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1000, 10000, 100000, 1000000].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              className="w-full border-gray-700 hover:border-[#FFB800] hover:bg-[#FFB800]/10"
              onClick={() => {
                const input = document.getElementById("amount") as HTMLInputElement
                input.value = amount.toString()
              }}
            >
              ${amount.toLocaleString()}
            </Button>
          ))}
        </div>

        <Button
          className="w-full bg-gradient-to-r from-[#FFB800] via-[#FF8C42] to-[#FF69B4] hover:opacity-90 text-white"
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  )
}

