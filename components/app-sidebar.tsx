"use client";

import * as React from "react";
import { Crown, MessageSquare, Sparkles, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
interface SidebarProps {
  onSubscribe: () => void;
}

export function AppSidebar({ onSubscribe }: SidebarProps) {
  return (
    <Sidebar collapsible="icon" className="mt-50 bg-transparent">
      <SidebarHeader className="border-b p-4">
        <div className="mb-4 flex flex-col justify-center p-4 h-full mt-40">
          {/* <h2 className="mb-2 text-lg font-semibold">Inchy Token</h2> */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 p-4 text-white">
            <div className="text-2xl font-bold">Inchy.ai</div>
            <div className="text-xl font-bold">Crypto, Evolved.</div>

            <div className="text-sm"></div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-center p-4 h-full">
        <div className="space-y-2">
          <Button variant="gradient" className="w-full" onClick={onSubscribe}>
            <Crown className="mr-2 h-4 w-4" />
            Subscribe Now
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Sparkles className="mr-2 h-4 w-4" />
            Premium Features
          </Button>
          <Link href="https://twitter.com/inchy_ai" target="_blank">
            <Button variant="ghost" className="w-full justify-start">
              <Twitter className="mr-2 h-4 w-4" />
              Twitter
            </Button>
          </Link>
          <Link href="https://t.me/inchy_ai" target="_blank">
            <Button variant="ghost" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Telegram
            </Button>
          </Link>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
