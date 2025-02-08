"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import PortfolioStep from "./portfolio-step"
import AssetAllocationStep from "./asset-allocation-step"
import PreferencesStep from "./preferences-step"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar";

const steps = ["Portfolio", "Asset Allocation", "Preferences"]

export default function AiSettings() {
  const [step, setStep] = useState(0)
  const router = useRouter()

  return (
    <><Navbar /><div className="min-h-screen bg-[#181c1f] text-white">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => {
              if (step > 0) setStep(step - 1)
              else router.back()
            } }
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">AI Settings</h1>
        </div>

        <div className="relative mb-12">
          <div className="absolute top-1/2 h-px w-full bg-gray-800 -translate-y-1/2" />
          <div
            className="absolute top-1/2 h-px  bg-gradient-to-r from-[#FFB800] via-[#FF8C42] to-[#FF69B4] bg-clip-text ml-28 -translate-y-1/2 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          <div className="relative z-10 flex justify-between">
            {steps.map((text, index) => (
              <div key={text} className="flex flex-col items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${index <= step
                      ? "bg-gradient-to-r from-[#FFB800] to-[#FF69B4] text-white"
                      : "bg-gray-800 text-gray-400"}`}
                >
                  {index + 1}
                </div>
                <span className={`text-sm transition-colors ${index <= step ? "text-white" : "text-gray-400"}`}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && <PortfolioStep onNext={() => setStep(1)} />}
            {step === 1 && <AssetAllocationStep onBack={() => setStep(0)} onNext={() => setStep(2)} />}
            {step === 2 && <PreferencesStep onBack={() => setStep(1)} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div></>
  )
}

