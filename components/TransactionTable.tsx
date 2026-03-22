import React, { useState, useEffect } from 'react';
import { fetchTransactions } from '@/lib/transactionService';
import { formatTimestamp, generateTableRow, handlePageChange } from '@/lib/transactionUtils';
import { TransactionTableStyles } from '../styles/TransactionTableStyles';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';



 const TransactionTable = ({ wallet }) => {
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const getTransactions = async () => {
      try {
        const operations = await fetchTransactions(wallet.Network, wallet.Address);
        setTransactions(operations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getTransactions();
  }, [wallet.Network, wallet.Address]);

  if (loading) return <div className="flex justify-center items-center text-5xl p-4">Loading...</div>;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = transactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

  const nextPage = () => handlePageChange(currentPage, totalPages, setCurrentPage, 'next');
  const prevPage = () => handlePageChange(currentPage, totalPages, setCurrentPage, 'prev');

  return (
    <>
    {/* <div id="TransactionTable" className={TransactionTableStyles.container}>
      <table className={TransactionTableStyles.table}>
        <thead className={TransactionTableStyles.thead}>
          <tr>
            <th className={TransactionTableStyles.th}>Date & Time</th>
            <th className={TransactionTableStyles.th}>Tx Hash</th>
            <th className={TransactionTableStyles.th}>From</th>
            <th className={TransactionTableStyles.th}>To</th>
            <th className={TransactionTableStyles.th}>Amount</th>
            <th className={TransactionTableStyles.th}>Type</th>
            <th className={TransactionTableStyles.th}>Token</th>
          </tr>
        </thead>
        <tbody className={TransactionTableStyles.tbody}>
          {currentTransactions.map((transaction, index) => generateTableRow(transaction, index, formatTimestamp)
          )}
        </tbody>
      </table>
      <div className={TransactionTableStyles.pagination}>
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`${TransactionTableStyles.button} ${currentPage === 1 ? TransactionTableStyles.disabledButton : TransactionTableStyles.enabledButton}`}
        >
          Previous
        </button>
        <span className={TransactionTableStyles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={`${TransactionTableStyles.button} ${currentPage === totalPages ? TransactionTableStyles.disabledButton : TransactionTableStyles.enabledButton}`}
        >
          Next
        </button>
      </div>




    </div>
     */}
    
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-blue-400">Date & Time</TableHead>
              <TableHead className="text-blue-400">Tx Hash</TableHead>
              <TableHead className="text-blue-400">From</TableHead>
              <TableHead className="text-blue-400">To</TableHead>
              <TableHead className="text-right text-blue-400">Amount</TableHead>
              <TableHead className="text-blue-400">Type</TableHead>
              <TableHead className="text-blue-400">Token</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTransactions.map((transaction, index) => (
              <TableRow key={index} className="hover:bg-gray-800/50 transition-colors">
                <TableCell className="font-medium text-gray-300">{formatTimestamp(transaction.timestamp)}
                </TableCell>
                <TableCell className="text-gray-300">{transaction.transactionHash ? `${transaction.transactionHash.substring(0, 5)}...` : 'N/A'}
                </TableCell>
                <TableCell className="text-gray-300">            {transaction.from ? `${transaction.from.substring(0, 6)}...${transaction.from.slice(-4)}` : 'N/A'}
                </TableCell>
                <TableCell className="text-gray-300">            {transaction.to ? `${transaction.to.substring(0, 6)}...${transaction.to.slice(-4)}` : 'N/A'}
                </TableCell>
                <TableCell className="text-right text-gray-300">amount</TableCell>
                <TableCell className="text-gray-300">{transaction.type}</TableCell>
                <TableCell className="text-gray-300">{transaction.tokenInfo.symbol}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className={TransactionTableStyles.pagination}>
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`${TransactionTableStyles.button} ${currentPage === 1 ? TransactionTableStyles.disabledButton : TransactionTableStyles.enabledButton}`}
        >
          Previous
        </button>
        <span className={TransactionTableStyles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={`${TransactionTableStyles.button} ${currentPage === totalPages ? TransactionTableStyles.disabledButton : TransactionTableStyles.enabledButton}`}
        >
          Next
        </button>
      </div>

      </div></>
  );

}

export default TransactionTable;