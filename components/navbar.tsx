"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut, Wallet } from "lucide-react";

export function Navbar() {
  const { login, authenticated, logout, ready } = usePrivy();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-black/50 backdrop-blur-xl">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent ml-28">
            Inchy.ai
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {ready && (
            <>
              {authenticated ? (
                <Button variant="ghost" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              ) : (
                <Button variant="ghost" onClick={login}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </>
          )}
          <Button variant="gradient">Subscribe</Button>
        </div>
      </div>
    </header>
  );
}
