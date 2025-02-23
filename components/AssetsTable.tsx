import React, { useEffect, useState } from 'react';
import TokenRow from './TokenRow';
import { AssestsTableStyle } from "../styles/AssetsTableStyle"; // Import unified theme classes
import { getImages } from '@/lib/coinGecko';
import { cn } from '@/lib/utils';

/**
 * AssetsTable component displays a table of tokens with their details.
 * @param {Object[]} tokens - Array of token data, where each token is represented by [symbol, data].
 * @returns {JSX.Element} The rendered AssetsTable component.
 */
const AssetsTable = ({ tokens }) => {
  const [iconsMap, setIconsMap] = useState({});

  useEffect(() => {
    const fetchIcons = async () => {
      /**
      Fetches token icons from an external source and updates the state.
     */
      if (tokens && tokens.length > 0) {
        const tokenNames = tokens.map(([symbol, data]) => data.name);
        const images = await getImages(tokenNames);
        setIconsMap(images);
      }
    };

    fetchIcons();
  }, [tokens]);

  return (
    <div id="AssetsTable"
    //  className={`${AssestsTableStyle.tableContainer}`}  
    
    className={cn(
        "flex flex-col",
        "w-[280px] shrink-0",
        "bg-zinc-900/70",
        "rounded-xl",
        "border border-zinc-800",
        "hover:border-zinc-700",
        "transition-all duration-200",
        "shadow-sm backdrop-blur-xl",
      )}
      >
      <table className={`${AssestsTableStyle.table} rounded-lg w-full`}>
        <thead className={AssestsTableStyle.thead}>
          <tr>
            <th className={AssestsTableStyle.th}>Token Name</th>
            <th className={AssestsTableStyle.th}>Amount</th>
            <th className={AssestsTableStyle.th}>24h Change (%)</th>
            <th className={AssestsTableStyle.th}>Price (USD)</th>
            <th className={AssestsTableStyle.th}>Total (USD)</th>
          </tr>
        </thead>
        <tbody className={AssestsTableStyle.tbody}>
          {tokens && tokens.map(([symbol, data]) => (
            <TokenRow key={symbol} symbol={symbol} data={data} iconsMap={iconsMap} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetsTable;