import React, { useEffect, useState } from 'react';
import TokenRow from './TokenRow';
import { AssestsTableStyle } from "../styles/AssetsTableStyle"; // Import unified theme classes
import { getImages } from '@/lib/coinGecko';
import { cn } from '@/lib/utils';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';

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
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">

      {/* <table className={`${AssestsTableStyle.table} rounded-lg w-full`}>
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
      </table> */}


      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-blue-400">Token Name</TableHead>
            <TableHead className="text-right text-blue-400">Amount</TableHead>
            <TableHead className="text-right text-blue-400">24h Change (%)</TableHead>
            <TableHead className="text-right text-blue-400">Price (USD)</TableHead>
            <TableHead className="text-right text-blue-400">Total (USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {tokens && tokens.map(([symbol, data]) => {
            const iconUrl = iconsMap[data.name.toLowerCase().replace(/\s+/g, '-')];

          return(

         
            <TableRow key={symbol} className="hover:bg-gray-800/50 transition-colors">
              <TableCell className="font-medium text-gray-200 flex">
              {iconUrl ? (
              <img src={iconUrl} alt={`${data.name} icon`} className="w-8 h-8" />
            ) : (
              <div className="w-8 h-8" />
            )}
                {data.name} ({symbol})
              </TableCell>
              <TableCell className="text-right text-gray-300">{data.balance.toFixed(3)}</TableCell>
              <TableCell className={`text-right ${data.price.diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                {data.price.diff >= 0 ? "+" : ""}
                {data.price.diff}%
              </TableCell>
              <TableCell className="text-right text-gray-300">{data.price.rate.toFixed(3)}$</TableCell>
              <TableCell className="text-right text-gray-300">{data.balanceInUsd.toFixed(2)}$</TableCell>
            </TableRow>
 )})}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetsTable;