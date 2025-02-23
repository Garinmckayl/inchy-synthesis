"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { Home, LogOut, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import FeaturesButton from "@/components/features";
import { AccountDetailtDialog } from "./account-detail-dialog";
import {SubscribeDialog} from "./subscribe-dialog";


interface NavbarProps {
  onSubscribe: () => void;
}

export function Navbar({ onSubscribe }: NavbarProps) {
  // console.log(onSubscribe)
  const [data, setData] = useState(null);
  console.log(data)

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






  // useEffect(() => {

  //   const fetchBalance = async () => {
  //     const apiKey = 'X7B2PMSTDXEZ9EUI586QT1529S3FGPBEYH';
  //     const address = '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae';
  //     const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;

  //     try {
  //       const response = await fetch(url);
  //       return await response.json();
  //     } catch (error) {
  //       console.error('Error fetching balance:', error);
  //       return null;
  //     }
  //   };

  //   const fetchLogs = async () => {
  //     const apiKey = 'X7B2PMSTDXEZ9EUI586QT1529S3FGPBEYH';
  //     const address = '0xbd3531da5cf5857e7cfaa92426877b022e612cf8';
  //     const url = `https://api.etherscan.io/v2/api?chainid=1&module=logs&action=getLogs&address=${address}&fromBlock=12878196&toBlock=12878196&page=1&offset=1000&apikey=${apiKey}`;

  //     try {
  //       const response = await fetch(url);
  //       return await response.json();
  //     } catch (error) {
  //       console.error('Error fetching logs:', error);
  //       return null;
  //     }
  //   };

  //   const fetchTransactions = async () => {
  //     const apiKey = 'X7B2PMSTDXEZ9EUI586QT1529S3FGPBEYH';
  //     const address = '0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC';
  //     const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${apiKey}`;

  //     try {
  //       const response = await fetch(url);
  //       return await response.json();
  //     } catch (error) {
  //       console.error('Error fetching transactions:', error);
  //       return null;
  //     }
  //   };

  //   const fetchData = async () => {
  //     try {
  //       const [balance, logs, transactions] = await Promise.all([
  //         fetchBalance(),
  //         fetchLogs(),
  //         fetchTransactions(),
  //       ]);

  //       setData({ balance, logs, transactions });
  //       console.log('data', data)
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     }
  //   };

  //   fetchData(); // Run the requests once

  // }, []); // Empty dependency array ensures this runs once


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
                      {/* {authenticated && <AccountDetailtDialog />} */}

              {authenticated ? (
                <>
                                <Link href={'/dashboard'} >

        <Button >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        </Link>
        <AccountDetailtDialog />
                  </>
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
