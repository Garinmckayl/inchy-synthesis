
// BestPerformingTable.jsx
import React, { useState, useEffect } from 'react';
import BuildTableRow from './BestPerformingRow';
import { BestPerformingTableStyle } from '../styles/BestPerformingTableStyle';
import { getImages } from '@lib/coinGecko';
import { sortTokensByPNL, getValue, formatPrice } from '@lib/bestperformingTableUtils';
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';




const BestPerformingTable = ({ tokens }) => {
    /**
   * BestPerformingTable component displays a table of the 10-top-performing tokens based on selected filter criteria from the user wallet.
   * @param {Object[]} tokens - Array of token data, where each token is represented by [symbol, data].
   * @returns {JSX.Element} The rendered BestPerformingTable component.
   */
  const [selectedFilter, setSelectedFilter] = useState('PNL_24h');
  const [iconsMap, setIconsMap] = useState({});

  useEffect(() => {
      /**
     * Fetches token icons from an external source and updates the iconsMap state.
     * Extracts token names from the tokens prop, retrieves their images, and updates state.
     */
    const fetchIcons = async () => {
      const tokenNames = tokens.map(([_, data]) => data.name);
      const images = await getImages(tokenNames);
      setIconsMap(images);
    };

    fetchIcons();
  }, [tokens]);

  const handleFilterChange = (event) => {
    setSelectedFilter(event.target.value);
  };

  const sortedData = sortTokensByPNL(tokens, selectedFilter);
  const topData = sortedData.slice(0, 10);

  return (
    <>
      <div className={BestPerformingTableStyle.filterContainer}>
        <div className="text-lg text-white font-semibold">Choose Criteria</div>
        <select
          value={selectedFilter}
          onChange={handleFilterChange}
          className={BestPerformingTableStyle.selectClass} >
          <option value="PNL_24h">24h PNL</option>
          <option value="PNL_week">7d PNL</option>
          <option value="PNL_month">30d PNL</option>
        </select>
      </div>

      {/* <div className={BestPerformingTableStyle.tableContainer}>
        <table className={BestPerformingTableStyle.table}>
          <thead className={BestPerformingTableStyle.thead}>
            <tr>
              <th className={BestPerformingTableStyle.th}>Rank</th>
              <th className={BestPerformingTableStyle.th}>Name</th>
              <th className={BestPerformingTableStyle.th}>Price (USD)</th>
              <th className={BestPerformingTableStyle.th}>PNL</th>
              <th className={BestPerformingTableStyle.th}>Balance</th>
              <th className={BestPerformingTableStyle.th}>Balance (USD)</th>
            </tr>
          </thead>
          <tbody className={BestPerformingTableStyle.tbody}>
            {topData.map(([symbol, data], index) =>
              <BuildTableRow 
                key={symbol}
                symbol={symbol} 
                data={data} 
                index={index + 1} 
                styles={BestPerformingTableStyle} 
                selectedFilter={selectedFilter} 
                iconsMap={iconsMap}
              />
            )}
          </tbody>
        </table>
      </div> */}



      <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-blue-400">Rank</TableHead>
            <TableHead className="text-blue-400">Name</TableHead>
            <TableHead className="text-right text-blue-400">Price (USD)</TableHead>
            <TableHead className="text-right text-blue-400">PNL (%)</TableHead>
            <TableHead className="text-right text-blue-400">Balance</TableHead>
            <TableHead className="text-right text-blue-400">Balance (USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {topData.map(([symbol, data], index) => {
            const pnl = getValue(data, selectedFilter);
            const iconUrl = iconsMap[data.name.toLowerCase().replace(/\s+/g, '-')];
return(       

  <><div className="flex-shrink-0 flex items-center justify-center">
    {iconUrl ? (
      <img src={iconUrl} alt={`${data.name} icon`} className="w-8 h-8" />
    ) : (
      <div className="w-8 h-8" />
    )}
  </div>
  <TableRow key={symbol} className="hover:bg-gray-800/50 transition-colors">
      <TableCell className="font-medium text-gray-400">{data.rank}</TableCell>
      <TableCell className="font-medium text-gray-200">
        {data.name} ({symbol})
      </TableCell>
      <TableCell className="text-right text-gray-300">{formatPrice(data.price.rate)}</TableCell>
      <TableCell className={`text-right text-green-400
              ${pnl === 0
          ? "text-gray-500 dark:text-gray-400"
          : pnl > 0
            ? "text-green-500 dark:text-green-400"
            : "text-red-500 dark:text-red-400"}`}>
        {pnl.toFixed(1)}%
      </TableCell>
      <TableCell className="text-right text-gray-300">          {data.balance.toFixed(2)}
      </TableCell>
      <TableCell className="text-right text-gray-300">{data.balanceInUsd.toFixed(2)}    </TableCell>
    </TableRow></>
)   })}
        </TableBody>
      </Table>
    </div>
    </>
  );
};

export default BestPerformingTable;
