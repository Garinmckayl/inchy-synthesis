"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CoinpaprikaAPI from "@coinpaprika/api-nodejs-client";

const client = new CoinpaprikaAPI();

// Example: Retrieve token prices for popular tokens
async function fetchTokenPrices() {
  const tickers = await client.getAllTickers();

  if (tickers.error) throw new Error(tickers.error);

  return tickers.map((ticker) => ({
    symbol: ticker.symbol,
    price: ticker.quotes?.USD?.price?.toFixed(2) || "0.00", // Assuming you want the price in USD
    change: ticker.quotes?.USD?.percent_change_24h
      ? `${ticker.quotes.USD.percent_change_24h.toFixed(2)}%`
      : "+0.00%", // Change in the last 24 hours
  }));
}

export function PriceMarquee() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const fetchedPrices = await fetchTokenPrices();
        setPrices(fetchedPrices);
      } catch (error) {
        console.error("Error fetching token prices:", error);
      }
    };

    fetchPrices();

    const interval = setInterval(fetchPrices, 30000); // Update prices every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-hidden border-b bg-black/50 backdrop-blur-xl">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="flex items-center space-x-8 py-2 text-sm font-medium"
      >
        {[...prices, ...prices].map((coin, i) => (
          <div key={i} className="flex items-center space-x-2">
            <span className="text-foreground/80">{coin.symbol}</span>
            <span className="font-mono">${coin.price}</span>
            <span
              className={
                coin.change.startsWith("+") ? "text-green-400" : "text-red-400"
              }
            >
              {coin.change}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
