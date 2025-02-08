"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"

export default function PreferencesStep({ onBack }: { onBack: () => void }) {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">AI Preferences</h2>
        <p className="text-gray-400">Customize how the AI manages your portfolio</p>
      </div>

      <div className="space-y-8 max-w-2xl">
        <div className="space-y-6">
          <Label>Risk Tolerance</Label>
          <RadioGroup defaultValue="balanced" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Label
              htmlFor="conservative"
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/30 p-4 cursor-pointer hover:bg-gray-900/50 [&:has(:checked)]:border-[#FFB800] [&:has(:checked)]:bg-[#FFB800]/10"
            >
              <RadioGroupItem value="conservative" id="conservative" className="sr-only" />
              <div className="h-8 w-8 rounded-full bg-green-500/10 text-green-400 grid place-items-center text-lg">
                🛡️
              </div>
              <span className="font-medium">Conservative</span>
              <span className="text-xs text-gray-400 text-center">Lower risk, stable returns</span>
            </Label>
            <Label
              htmlFor="balanced"
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/30 p-4 cursor-pointer hover:bg-gray-900/50 [&:has(:checked)]:border-[#FFB800] [&:has(:checked)]:bg-[#FFB800]/10"
            >
              <RadioGroupItem value="balanced" id="balanced" className="sr-only" />
              <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-400 grid place-items-center text-lg">⚖️</div>
              <span className="font-medium">Balanced</span>
              <span className="text-xs text-gray-400 text-center">Moderate risk and returns</span>
            </Label>
            <Label
              htmlFor="aggressive"
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/30 p-4 cursor-pointer hover:bg-gray-900/50 [&:has(:checked)]:border-[#FFB800] [&:has(:checked)]:bg-[#FFB800]/10"
            >
              <RadioGroupItem value="aggressive" id="aggressive" className="sr-only" />
              <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-400 grid place-items-center text-lg">🚀</div>
              <span className="font-medium">Aggressive</span>
              <span className="text-xs text-gray-400 text-center">Higher risk, higher potential</span>
            </Label>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Rebalancing Frequency</Label>
            <span className="text-sm text-gray-400">Weekly</span>
          </div>
          <Slider defaultValue={[3]} min={1} max={5} step={1} className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Daily</span>
            <span>Monthly</span>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Additional Settings</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-medium">Auto-compound Rewards</span>
                <p className="text-sm text-gray-400">Automatically reinvest earned rewards</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-medium">Smart Stop Loss</span>
                <p className="text-sm text-gray-400">AI-managed stop loss orders</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-medium">Market Updates</span>
                <p className="text-sm text-gray-400">Receive AI analysis and insights</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button className="bg-gradient-to-r from-[#FFB800] via-[#FF8C42] to-[#FF69B4] hover:opacity-90 text-white">
            Save Preferences
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

