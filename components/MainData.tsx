import React, { useState, useEffect } from "react";
import WalletFees from "./WalletFees";
import DistributionChart from "./DistributionChart";
import { calculateTotalAndTopBalances } from '@lib/mainDataUtils';
import { styles } from '../styles/MainDataStyles'; // Import styles
import { cn } from "@/lib/utils"
import {
    Calendar,
    type LucideIcon,
    ArrowRight,
    CheckCircle2,
    Timer,
    AlertCircle,
    PiggyBank,
    TrendingUp,
    CreditCard,
    Wallet,
  } from "lucide-react" 
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";


/**
 * MainData component displays the total balance, wallet fees, and a distribution chart.
 * @param {Object} props - Component props.
 * @param {string} props.address - Wallet address.
 * @param {Array} props.tokens - Array of token objects containing symbol and balance.
 * @returns {JSX.Element} The rendered MainData component.
 */
function MainData({ address, tokens }) {
  const [totalBalance, setTotalBalance] = useState(0);
  const [topBalances, setTopBalances] = useState([]);

  useEffect(() => {
    if (tokens) {
      const { total, top } = calculateTotalAndTopBalances(tokens);
      setTotalBalance(total);
      setTopBalances(top);
    }
  }, [tokens]);

  return (
    // <div className={styles.container}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* <div className={styles.totalBalanceCard}>
          <div className="text-center">
            <div className="font-semibold text-xl sm:text-2xl mb-2">
              Total Balance:
            </div>
            <div className="font-bold text-2xl sm:text-3xl">
              ${totalBalance.toFixed(2)}
            </div>
          </div>
        </div> */}

        {/* <div
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
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                  )}
                >

                </div>
              </div>

              <div>
                <h1 className="text-3xl font-bold font-medium text-zinc-900 dark:text-zinc-100 mb-1"> Total Balance:
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">usd</p>
              </div>


                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-medium text-zinc-900 dark:text-zinc-100"> ${totalBalance.toFixed(2)}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">total</span>
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
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-[#111111]/90 border-gray-800/50 backdrop-blur-xl relative overflow-hidden rounded-xl border">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-gray-200">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-gray-100">${totalBalance.toFixed(2)}</div>
            {/* <p className="text-xs text-gray-400 mt-1">+$2,345.20 (6.58%)</p> */}
          </CardContent>
        </Card>
      </motion.div>

        <div>
          <WalletFees address={address} />
        </div>
        <div className={styles.chartCard}>
          <DistributionChart tokens={topBalances} />
        </div>
      </div>
    // </div>
  );
}

export default MainData;