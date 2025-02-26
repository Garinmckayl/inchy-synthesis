"use client"

import { Bell, Search, User, Eye, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TokenList } from "@/components/token-list"
import { ActivityFeed } from "@/components/activity-feed"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AiActions } from "@/components/ai-actions"
import NetWorthCard from "@/components/net-worth-card"
import { Navbar } from "@/components/navbar";
import WalletData from "@/components/showcaseWalletData";
import Avatar from "boring-avatars";
import { usePrivy } from "@privy-io/react-auth";


export default function Dashboard() {
    const { login, authenticated, user, logout, ready } = usePrivy();

  return (
    <><Navbar /><div className="min-h-screen bg-[#0c1013] text-white">
 
          {/* <header className="border-b border-gray-800 px-4 py-2">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
                      <div className="flex items-center justify-between lg:justify-start gap-2">
                          <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-purple-600 grid place-items-center">Z</div>
                              <span className="font-semibold">Zapper</span>
                          </div>
                          <div className="flex items-center gap-4 lg:hidden">
                              <Button variant="ghost" size="icon">
                                  <User className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                  <Bell className="h-5 w-5" />
                              </Button>
                          </div>
                      </div>
                      <div className="relative">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                              className="w-full lg:w-80 bg-gray-800 border-gray-700 pl-8"
                              placeholder="Search accounts, NFTs, tokens..." />
                      </div>
                      <nav className="flex gap-6 overflow-x-auto pb-2 lg:pb-0">
                          <Button variant="ghost">Swap</Button>
                          <Button variant="ghost">Bridge</Button>
                          <Button variant="ghost">Curate</Button>
                      </nav>
                  </div>
                  <div className="hidden lg:flex items-center gap-4">
                      <Button variant="ghost" size="icon">
                          <User className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                          <Bell className="h-5 w-5" />
                      </Button>
                      <div className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1">
                          <div className="h-6 w-6 rounded bg-green-400" />
                          <span className="text-sm">0xf39f...2266</span>
                      </div>
                  </div>
              </div>
          </header> */}

          <main className="container mx-auto px-4 py-8">
              <div className="mb-8 flex flex-col sm:flex-row items-start gap-8">
                  <div className="relative group w-24 mx-auto sm:mx-0">
                      {/* <div className="h-24 w-24 rounded bg-green-400" /> */}
                      <Avatar name={user?.email ? user.email : user?.wallet} className="h-24 w-24 rounded" variant="beam"/>
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Share2 className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>
                  <div className="text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                          <h1 className="text-xl font-semibold">0xf39f...2266</h1>
                          <Button variant="secondary" size="sm">
                              Copy
                          </Button>
                      </div>

                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
              <WalletData/>
                  <div className="space-y-6">
                      <AiActions />
                  </div>
                  
              </div>
             
          </main>
      </div></>
  )
}

