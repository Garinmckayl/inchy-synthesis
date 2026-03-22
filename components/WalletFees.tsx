import React, { useState, useEffect } from 'react';
import { WalletFeesStyle } from '../styles/WalletFeesStyle'; // Adjust the path based on your project structure
import { fetchFees } from '@lib/feesUtils';
import { getETH, getBNB } from '@lib/coinGecko';
import { cn } from '@/lib/utils';
import { ArrowRight, CoinsIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { GasPump } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
/**
 * WalletFees calculates and displays the total gas fees in USD for Ethereum and BNB transactions.
 * @param {Object} props - Component props.
 * @param {string} props.address - The wallet address to fetch fees for.
 * @returns {JSX.Element} The rendered WalletFees component.
 */
function WalletFees({ address }) {
    const [ethFees, setEthFees] = useState(0);
    const [bnbFees, setBnbFees] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const ethPrice = await getETH();
                const bnbPrice = await getBNB();
                const [ethFee, bnbFee] = await fetchFees(address);

                setEthFees(ethPrice * ethFee);
                setBnbFees(bnbPrice * bnbFee);
            } catch (error) {
                console.log("Error: ", error);
            } 
        };
        if (address) {
            fetchData();
        }
    }, [address]);

    return (
        <>
        {/* <div             className={cn(
              "flex flex-col",
              "w-[280px] shrink-0",
              "bg-white dark:bg-zinc-900/70",
              "rounded-xl",
              "border border-zinc-100 dark:border-zinc-800",
              "hover:border-zinc-200 dark:hover:border-zinc-700",
              "transition-all duration-200",
              "shadow-sm backdrop-blur-xl",
            )}>
            <div >
                <div className="text-xs text-zinc-400 line-clamp-2">
                    Wallet Gas Fees
                </div>
                <div className="text-xs text-zinc-400 line-clamp-2">
                    Total fees in USD: <span className="">${(ethFees + bnbFees).toFixed(2)}</span>
                </div>
            </div>
            
            <div className="">
                <div className="">
                    <div className="text-xs text-zinc-400 line-clamp-2">ETH fees:</div>
                    <div className="text-xs text-zinc-400 line-clamp-2">${ethFees.toFixed(2)}</div>
                </div>
                
                <div className="text-xs text-zinc-400 line-clamp-2">
                    <div className="text-xs text-zinc-400 line-clamp-2">BNB fees:</div>
                    <div className="text-xs text-zinc-400 line-clamp-2">${bnbFees.toFixed(2)}</div>
                </div>
            </div>
            </div>
 */}


{/* 
            <div
            className={cn(
              "flex flex-col",
              "w-[280px] shrink-0",
              "bg-white dark:bg-zinc-900/70",
              "rounded-xl",
              "border border-zinc-100 dark:border-zinc-800",
              "hover:border-zinc-200 dark:hover:border-zinc-700",
              "transition-all duration-200",
              "shadow-sm backdrop-blur-xl",
            )}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-lg")}>
                  <CoinsIcon className="w-4 h-4" />
                </div>
                <div
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                  )}
                >

                </div>
              </div>

              <div>
                <h1 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">   Wallet Gas Fees
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">usd</p>
              </div>


                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Total fees in USD: <span className="">${(ethFees + bnbFees).toFixed(2)}</span>
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">

                  ETH fees: ${ethFees.toFixed(2)}
                  <br />
                  BNB fees: ${bnbFees.toFixed(2)}
                  </span>
                </div>
              

            </div>

            <div className="mt-auto border-t border-zinc-100 dark:border-zinc-800">
              <button
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "py-2.5 px-3",
                  "text-xs font-medium",
                  "text-zinc-600 dark:text-zinc-400",
                  "hover:text-zinc-900 dark:hover:text-zinc-100",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                  "transition-colors duration-200",
                )}
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div> */}


          <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-[#111111]/90 border-gray-800/50 backdrop-blur-xl relative overflow-hidden border rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-200">Wallet Gas Fees</CardTitle>
            <GasPump className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-gray-100">${(ethFees + bnbFees).toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1"> ETH fees: ${ethFees.toFixed(2)}
                  <br />
                  BNB fees: ${bnbFees.toFixed(2)}</p>
          </CardContent>
        </Card>
      </motion.div>

        </>
    );
}

export default WalletFees;