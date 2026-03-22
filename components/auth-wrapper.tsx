"use client"

import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { login, authenticated, ready } = usePrivy()

  if (!ready) {
    return null
  }

  if (!authenticated) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-muted-foreground">Please connect your wallet to access Inchy.ai</p>
        <Button onClick={login}>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

