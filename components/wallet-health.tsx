"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, TrendingUp, Fuel, AlertTriangle, Check, X, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface WalletAnalysis {
  healthScore: number
  portfolioDistribution: {
    description: string
    risks: string[]
    opportunities: string[]
  }
  gasAnalysis: {
    monthlySpending: string
    efficiency: number
    recommendations: string[]
  }
  securityScore: number
  recommendations: {
    type: 'security' | 'portfolio' | 'gas' | 'general'
    priority: number
    suggestion: string
    reasoning: string
  }[]
}

interface WalletHealthProps {
  tokens: any
  address: string
  network: string
}

export function WalletHealth({ tokens, address, network }: WalletHealthProps) {
  const [analysis, setAnalysis] = useState<WalletAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const analyzeWallet = async (forceRefresh = false) => {
    if (!tokens || !address || !network) {
      setError("Missing required wallet data")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/analyze-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletData: tokens,
          address,
          network,
          forceRefresh
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to analyze wallet')
      }
      
      const data = await response.json()
      setAnalysis(data)
      setError(null)
    } catch (error) {
      console.error('Error analyzing wallet:', error)
      setError(error.message || 'Failed to analyze wallet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tokens && address && network) {
      analyzeWallet()
    }
  }, [tokens, address, network])

  if (!tokens || !address || !network) {
    return (
      <Card className="bg-[#181c1f] border-gray-800 text-white w-[90%] mt-[60px] rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Waiting for wallet data...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-[#181c1f] border-gray-800 text-white w-[90%] mt-[60px] rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <CardTitle className="text-base font-medium">Analysis Error</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => analyzeWallet(true)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-[#181c1f] border-gray-800 text-white w-[90%] mt-[60px] rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Analyzing Wallet Health...</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={33} className="w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  const priorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'text-red-400'
      case 2:
        return 'text-orange-400'
      case 3:
        return 'text-yellow-400'
      case 4:
        return 'text-blue-400'
      case 5:
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <Card className="bg-[#181c1f] border-gray-800 text-white w-[90%] mt-[60px] rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-zinc-200" />
          <CardTitle className="text-base font-medium">Wallet Health</CardTitle>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-400">Network: {network}</div>
          <div className="text-sm text-zinc-400">Security: {analysis.securityScore}/100</div>
          <div className="text-sm text-zinc-400">Health: {analysis.healthScore}/100</div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => analyzeWallet(true)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Progress value={analysis.healthScore} className="w-full" />
        </div>

        <div className="space-y-4">
          {analysis.portfolioDistribution && (
            <div className="flex items-start gap-3 rounded-lg bg-gray-800/50 p-3">
              <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-zinc-200">Portfolio Distribution</p>
                <p className="text-sm text-zinc-400">{analysis.portfolioDistribution.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-300 mb-1">Risks</p>
                    <ul className="space-y-1">
                      {analysis.portfolioDistribution.risks.map((risk, i) => (
                        <li key={i} className="text-xs text-red-400 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-300 mb-1">Opportunities</p>
                    <ul className="space-y-1">
                      {analysis.portfolioDistribution.opportunities.map((opp, i) => (
                        <li key={i} className="text-xs text-green-400 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysis.gasAnalysis && (
            <div className="flex items-start gap-3 rounded-lg bg-gray-800/50 p-3">
              <Fuel className="h-5 w-5 text-orange-400 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-200">Gas Analysis</p>
                  <p className="text-xs text-zinc-400">{analysis.gasAnalysis.monthlySpending}</p>
                </div>
                <Progress value={analysis.gasAnalysis.efficiency} className="w-full h-1" />
                <p className="text-xs text-zinc-400">Efficiency Score: {analysis.gasAnalysis.efficiency}%</p>
                <ul className="space-y-1 mt-2">
                  {analysis.gasAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-zinc-400">• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-lg bg-gray-800/50 p-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Key Recommendations</p>
              <div className="space-y-3 mt-2">
                {analysis.recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .map((rec, i) => (
                    <div key={i} className="space-y-1">
                      <p className={cn("text-sm font-medium", priorityColor(rec.priority))}>
                        {rec.suggestion}
                      </p>
                      <p className="text-xs text-zinc-500">{rec.reasoning}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
