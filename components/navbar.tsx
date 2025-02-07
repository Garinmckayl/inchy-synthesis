"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import FeaturesButton from "@/components/features";
import { AccountDetailtDialog } from "./account-detail-dialog";
import {SubscribeDialog} from "./subscribe-dialog";


interface NavbarProps {
  onSubscribe: () => void;
}

export function Navbar({ onSubscribe }: NavbarProps) {
  // console.log(onSubscribe)
  const { login, authenticated, user, logout, ready } = usePrivy();
  const [isOpen, setSubscribeDialogOpen] = useState(false);


  const handleLogin = async () => {
    console.log("Attempting to log in...");
    await login();
  };
  useEffect(() => {
    if (authenticated && user) {
      console.log("User logged in:", { authenticated, user });
      console.log("Calling API to check/create user...");

      const createUser = async () => {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email?.address,
            wallet: user.wallet,
          }),
        });

        const data = await response.json();
        if (!data.isActive) {
          setSubscribeDialogOpen(true);
        // alert('unsubscribed user')
        }
        console.log("API response:", data);
      };

      createUser().catch((error) => {
        console.error("Error calling API:", error);
      });
    } else if (!authenticated) {
      console.log("User is not authenticated or user object is missing.");
    }
  }, [authenticated, user]); // Run this effect when authenticated or user changes

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
                      {authenticated && <AccountDetailtDialog />}

              {authenticated ? (
                <Button variant="ghost" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleLogin}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </>
          )}
          <Button className="mr-8" onClick={onSubscribe}>Subscribe</Button>
          <FeaturesButton />
          <SubscribeDialog
            onSubscribe={onSubscribe}
            isOpen={isOpen}
            onOpenChange={setSubscribeDialogOpen}
          />        </div>
      </div>
    </header>
  );
}
