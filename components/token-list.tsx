"use client"

import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

const tokens = [
  {
    name: "YSL",
    icon: "🟣",
    price: 13.34,
    balance: "0.02",
    value: 0.27,
  },
  {
    name: "ETH",
    icon: "🔷",
    price: 3334.05,
    balance: "<0.00001",
    value: 0.0,
  },
  {
    name: "MNEAR",
    icon: "🟡",
    price: 0.00738,
    balance: "300,000",
    value: 0.0,
  },
  {
    name: "SAPR",
    icon: "🟢",
    price: 0.0000203,
    balance: "1",
    value: 0.0,
  },
  {
    name: "ADoge",
    icon: "🔵",
    price: 0.9909,
    balance: "1",
    value: 0.0,
  },
]

export function TokenList() {
  return (
    <div className="rounded-lg border border-gray-800 bg-[#181c1f] overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <h2 className="font-medium text-sm">Wallet</h2>
        <span className="font-medium">$0.27</span>
      </div>
      <div className="border-t border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 bg-gray-900/50">
              <th className="p-4 font-medium">Token</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Balance</th>
              <th className="p-4 font-medium">Value</th>
              <th className="w-4"></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.name} className="border-t border-gray-800">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{token.icon}</span>
                    <span>{token.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  $
                  {token.price.toLocaleString("en-US", {
                    minimumFractionDigits: token.price < 1 ? 6 : 2,
                    maximumFractionDigits: 6,
                  })}
                </td>
                <td className="p-4">{token.balance}</td>
                <td className="p-4">${token.value.toFixed(2)}</td>
                <td className="p-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-800">
        <Button variant="outline" className="w-full" size="sm">
          View all (7)
        </Button>
      </div>
    </div>
  )
}

