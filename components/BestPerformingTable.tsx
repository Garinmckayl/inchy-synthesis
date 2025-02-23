
// BestPerformingTable.jsx
import React, { useState, useEffect } from 'react';
import BuildTableRow from './BestPerformingRow';
import { BestPerformingTableStyle } from '../styles/BestPerformingTableStyle';
import { getImages } from '@lib/coinGecko';
import { sortTokensByPNL } from '@lib/bestperformingTableUtils';



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
          className={BestPerformingTableStyle.selectClass}>
          <option value="PNL_24h">24h PNL</option>
          <option value="PNL_week">7d PNL</option>
          <option value="PNL_month">30d PNL</option>
        </select>
      </div>

      <div className={BestPerformingTableStyle.tableContainer}>
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
      </div>
    </>
  );
};

export default BestPerformingTable;
