"use client"

import React, { useState, useEffect } from 'react';
import AssetsTable from './AssetsTable';
import TransactionTable from './TransactionTable';
import TabButtons from './TabButtons';
import BestPerformingTable from './BestPerformingTable';
import MainData from './MainData';
import { getUrlString } from '@/lib/urlUtils';
import { processWalletData } from '@/lib/walletUtils';
import { usePrivy } from "@privy-io/react-auth";
import ChooseNetwork from '@/components/ChooseNetwork';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletHealth } from '@/components/wallet-health';

/**
 * WalletData fetches and displays wallet data including assets, transactions, and best-performing tokens.
 * @param {Object} props - Component props.
 * @param {Object} props.wallet - The wallet object containing network and address information.
 * @returns {JSX.Element} The rendered WalletData component.
 */
function WalletData() {
    const [tokens, setTokens] = useState(null); 
    const [activeTab, setActiveTab] = useState(null);
    const { login, authenticated, user, logout, ready } = usePrivy();
    const [wallet, setWallet] = React.useState({
      Address: '',
      Network: '',
      isConnected: true,
    });

    const handleStatus = (address, network, isConnected) => {
      setWallet({
        Address: address,
        Network: network,
        isConnected: isConnected,
      });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
              const url = getUrlString("Ethereum", 'getAddressInfo', "0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C");
              const response = await fetch(url);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const json = await response.json();
                const data = processWalletData(json);
                setTokens(data);
            } catch (error) {
                console.log("Error:", error);
            } 
        };
        handleStatus("0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C", wallet.Network, true);
        fetchData();
    }, [wallet.Network]);

    const handleChangeNetwork = (network) => {
      setWallet({
        ...wallet,
        Network: network
      });
    };

    return (
        <>
        <div>
            <div className=''>
            <ChooseNetwork handleChangeNetwork={handleChangeNetwork}/>
                <MainData address={wallet.Address} tokens={tokens} />
                <WalletHealth 
                  tokens={tokens} 
                  address={wallet.Address}
                  network={wallet.Network || "ethereum"} 
                />
            </div>
            <div className="mt-4">
                <h2 className="pl-4 text-base font-medium text-zink-200 mb-2">
                    Choose an option below to view detailed information:
                </h2>
                <p className="pl-4 text-sm text-zink-200 mb-4">
                    Use the tabs to switch between viewing your assets, transaction history, and the best performing tokens in your wallet.
                </p>
                <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 rounded-lg p-1">
                <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-blue-500/20">
                    Overview/Assets
                </TabsTrigger>
                <TabsTrigger value="bestperforming" className="rounded-md data-[state=active]:bg-blue-500/20">
                    Best Performing
                </TabsTrigger>
                <TabsTrigger value="transactions" className="rounded-md data-[state=active]:bg-blue-500/20">
                    Transactions
                </TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                    <AssetsTable tokens={tokens} />
                </TabsContent>
                <TabsContent value="transactions">
                    <TransactionTable wallet={wallet} />
                </TabsContent>
                <TabsContent value="bestperforming">
                    <BestPerformingTable tokens={tokens} />
                </TabsContent>
                </Tabs>
            </div>
        </div>
        </>
    );  
}

export default WalletData;
