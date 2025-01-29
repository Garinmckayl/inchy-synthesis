"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const mockPrices = [
  { symbol: "BTC", price: "41,234.56", change: "+2.45%" },
  { symbol: "ETH", price: "2,345.67", change: "+1.23%" },
  { symbol: "INCHY", price: "0.00123", change: "+15.7%" },
  { symbol: "SOL", price: "98.76", change: "+4.56%" },
  { symbol: "DOT", price: "6.789", change: "-0.89%" },
]

export function PriceMarquee() {
  const [prices, setPrices] = useState(mockPrices)

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(
        prices.map((p) => ({
          ...p,
          price: (Number.parseFloat(p.price.replace(",", "")) * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2),
          change: `${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 5).toFixed(2)}%`,
        })),
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [prices])

  return (
    <div className="w-full overflow-hidden border-b bg-black/50 backdrop-blur-xl">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="flex items-center space-x-8 py-2 text-sm font-medium"
      >
        {[...prices, ...prices].map((coin, i) => (
          <div key={i} className="flex items-center space-x-2">
            <span className="text-foreground/80">{coin.symbol}</span>
            <span className="font-mono">${coin.price}</span>
            <span className={coin.change.startsWith("+") ? "text-green-400" : "text-red-400"}>{coin.change}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

