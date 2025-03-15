"use client"

import { useEffect, useState, useCallback } from "react"
import { ethers } from "ethers";
import { Scan, ChevronDown, ChevronUp, ExternalLink, LineChart, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Zap, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Navbar } from "@/components/navbar";
import { toast } from "@/components/ui/use-toast";

// Protocol Configuration
const PROTOCOLS = {
  AAVE: {
    name: 'Aave V3',
    contract: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    riskLevel: 'Medium',
    minAPY: 2.5,
    gasEstimate: 250000
  },
  LIDO: {
    name: 'Lido',
    contract: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    riskLevel: 'Low',
    minAPY: 3.5,
    gasEstimate: 150000
  },
  EIGEN: {
    name: 'EigenLayer',
    contract: '0x858646372CC42E1A627fcE94aa7A7033e7CF075A',
    riskLevel: 'High',
    minAPY: 5.0,
    gasEstimate: 350000
  }
};

interface ProtocolYield {
  protocol: string;
  apy: number;
  tvl: number;
  riskLevel: string;
  token: string;
  gasEstimate: number;
}

// Enhanced yield fetching with real-time data
const fetchProtocolYields = async (): Promise<ProtocolYield[]> => {
  try {
    const [aaveData, lidoData, eigenData] = await Promise.all([
      fetch('https://aave-api-v2.aave.com/data/pools/latest'),
      fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma'),
      fetch('https://api.eigenlayer.xyz/v1/apy')
    ]).then(responses => Promise.all(responses.map(r => r.json())));

    return [
      {
        protocol: 'Aave',
        apy: aaveData.liquidityRate * 100,
        tvl: aaveData.totalLiquidity,
        riskLevel: PROTOCOLS.AAVE.riskLevel,
        token: 'ETH',
        gasEstimate: PROTOCOLS.AAVE.gasEstimate
      },
      {
        protocol: 'Lido',
        apy: lidoData.apr,
        tvl: lidoData.tvl,
        riskLevel: PROTOCOLS.LIDO.riskLevel,
        token: 'stETH',
        gasEstimate: PROTOCOLS.LIDO.gasEstimate
      },
      {
        protocol: 'EigenLayer',
        apy: eigenData.apy,
        tvl: eigenData.tvl,
        riskLevel: PROTOCOLS.EIGEN.riskLevel,
        token: 'eETH',
        gasEstimate: PROTOCOLS.EIGEN.gasEstimate
      }
    ];
  } catch (error) {
    console.error('Error fetching protocol data:', error);
    toast({
      title: "Error fetching protocol data",
      description: "Please try again later",
      variant: "destructive"
    });
    return [];
  }
};
  
  const calculateOptimalStrategy = (yields: ProtocolYield[], userRiskLevel: number, gasPrice: number): ProtocolYield | null => {
    const riskScores = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const userRiskThreshold = Math.ceil(userRiskLevel / 1.67); // Convert 1-5 scale to 1-3

    // Filter protocols based on user risk tolerance
    const eligibleYields = yields.filter(y => riskScores[y.riskLevel] <= userRiskThreshold);
    if (eligibleYields.length === 0) return null;

    // Calculate scores considering APY, TVL, gas costs, and risk
    return eligibleYields.reduce((best, current) => {
      const gasCost = (current.gasEstimate * gasPrice) / 1e9; // Convert to ETH
      const annualizedReturn = (current.apy / 100) - (gasCost * 12); // Assuming monthly rebalancing
      
      const currentScore = (
        annualizedReturn * 0.5 + // 50% weight on actual returns
        (current.tvl / 1e9) * 0.3 + // 30% weight on TVL (normalized to billions)
        (1 / riskScores[current.riskLevel]) * 0.2 // 20% weight on inverse risk score
      );

      const bestScore = best ? (
        (best.apy / 100) * 0.5 +
        (best.tvl / 1e9) * 0.3 +
        (1 / riskScores[best.riskLevel]) * 0.2
      ) : 0;

      return currentScore > bestScore ? current : best;
    }, null as ProtocolYield | null);
  };
  
  const rebalanceFunds = async (signer: ethers.Signer, currentStrategy: ProtocolYield, newStrategy: ProtocolYield): Promise<boolean> => {
    try {
      const userAddress = await signer.getAddress();
      const balance = await signer.provider!.getBalance(userAddress);
      
      // Check if user has enough balance
      if (balance.lt(ethers.utils.parseEther('0.1'))) {
        toast({
          title: 'Insufficient balance',
          description: 'You need at least 0.1 ETH to perform rebalancing',
          variant: 'destructive'
        });
        return false;
      }

      // Get gas price and estimate total cost
      const gasPrice = await signer.provider!.getGasPrice();
      const totalGasEstimate = currentStrategy.gasEstimate + newStrategy.gasEstimate;
      const gasCost = gasPrice.mul(totalGasEstimate);
      
      if (gasCost.gt(balance.div(4))) {
        toast({
          title: 'High gas costs',
          description: 'Gas costs exceed 25% of transaction value',
          variant: 'destructive'
        });
        return false;
      }

      // Execute rebalancing
      if (currentStrategy.protocol === 'Aave') {
        const aaveContract = new ethers.Contract(PROTOCOLS.AAVE.contract, AAVE_ABI, signer);
        const tx = await aaveContract.withdraw(
          ethers.constants.AddressZero, // ETH
          ethers.constants.MaxUint256,
          userAddress,
          { gasLimit: currentStrategy.gasEstimate }
        );
        await tx.wait();
      } else if (currentStrategy.protocol === 'Lido') {
        const lidoContract = new ethers.Contract(PROTOCOLS.LIDO.contract, LIDO_ABI, signer);
        const tx = await lidoContract.withdraw(
          ethers.constants.MaxUint256,
          { gasLimit: currentStrategy.gasEstimate }
        );
        await tx.wait();
      }

      // Small delay to ensure transactions are processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Deposit into new protocol
      if (newStrategy.protocol === 'Aave') {
        const aaveContract = new ethers.Contract(PROTOCOLS.AAVE.contract, AAVE_ABI, signer);
        const tx = await aaveContract.supply(
          ethers.constants.AddressZero,
          ethers.constants.MaxUint256,
          userAddress,
          0,
          { gasLimit: newStrategy.gasEstimate }
        );
        await tx.wait();
      } else if (newStrategy.protocol === 'Lido') {
        const lidoContract = new ethers.Contract(PROTOCOLS.LIDO.contract, LIDO_ABI, signer);
        const tx = await lidoContract.submit(ethers.constants.AddressZero, {
          value: balance.sub(gasCost),
          gasLimit: newStrategy.gasEstimate
        });
        await tx.wait();
      } else if (newStrategy.protocol === 'EigenLayer') {
        const eigenContract = new ethers.Contract(PROTOCOLS.EIGEN.contract, EIGEN_ABI, signer);
        const tx = await eigenContract.deposit({
          value: balance.sub(gasCost),
          gasLimit: newStrategy.gasEstimate
        });
        await tx.wait();
      }

      toast({
        title: 'Rebalancing successful',
        description: `Moved funds from ${currentStrategy.protocol} to ${newStrategy.protocol}`,
        variant: 'default'
      });
      
      return true;
    } catch (error) {
      console.error('Rebalancing error:', error);
      toast({
        title: 'Rebalancing failed',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };


export default function Home() {
  const [yields, setYields] = useState<ProtocolYield[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<ProtocolYield | null>(null);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [gasPrice, setGasPrice] = useState<number>(0);
  const [autoRebalance, setAutoRebalance] = useState(false);
  const [riskLevel, setRiskLevel] = useState(2); // 1-5 scale

  // Fetch protocol yields and gas prices
  const fetchData = useCallback(async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const [newYields, newGasPrice] = await Promise.all([
        fetchProtocolYields(),
        provider.getGasPrice()
      ]);

      setYields(newYields);
      setGasPrice(newGasPrice.toNumber());
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  // Initialize data fetching
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  // Monitor for rebalancing opportunities
  useEffect(() => {
    if (!yields.length || !currentStrategy || isRebalancing || !autoRebalance) return;

    const optimalStrategy = calculateOptimalStrategy(yields, riskLevel, gasPrice);
    if (optimalStrategy && 
        optimalStrategy.protocol !== currentStrategy.protocol && 
        optimalStrategy.apy > currentStrategy.apy * 1.1) { // 10% improvement threshold
      handleRebalance(optimalStrategy);
    }
  }, [yields, currentStrategy, riskLevel, gasPrice, isRebalancing, autoRebalance]);

  const handleRebalance = async (newStrategy: ProtocolYield) => {
    if (!currentStrategy || isRebalancing) return;

    setIsRebalancing(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []); // Request wallet connection
      const signer = provider.getSigner();
      
      const success = await rebalanceFunds(signer, currentStrategy, newStrategy);
      if (success) {
        setCurrentStrategy(newStrategy);
        toast({
          title: 'Strategy Updated',
          description: `Successfully moved to ${newStrategy.protocol} for ${newStrategy.apy.toFixed(2)}% APY`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Rebalancing error:', error);
      toast({
        title: 'Rebalancing Failed',
        description: 'Please check your wallet connection and try again',
        variant: 'destructive'
      });
    } finally {
      setIsRebalancing(false);
    }
  };

  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedAsset(expandedAsset === id ? null : id);
  };

  const getRiskLabel = (level: number) => {
    switch (level) {
      case 1: return "Very Conservative";
      case 2: return "Conservative";
      case 3: return "Moderate";
      case 4: return "Aggressive";
      case 5: return "Very Aggressive";
      default: return "Conservative";
    }
  };

  const getProtocolStats = (protocol: ProtocolYield) => {
    const annualizedReturn = protocol.apy - ((protocol.gasEstimate * gasPrice / 1e9) * 12);
    return {
      apy: protocol.apy.toFixed(2),
      annualizedReturn: annualizedReturn.toFixed(2),
      tvl: (protocol.tvl / 1e9).toFixed(2),
      risk: protocol.riskLevel,
      gasEstimate: (protocol.gasEstimate * gasPrice / 1e18).toFixed(4)
    };
  };

  return (
    <div className="min-h-screen bg-[#080812] text-white">
         <Navbar />
      <main className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
          <Card className="border-[#1e2134] bg-[#0d101f]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-white" />
          Asset Scanner
        </CardTitle>
        <CardDescription className="text-gray-300">Your assets across supported DeFi protocols</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4 bg-[#161a2c]">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]">
              All Assets
            </TabsTrigger>
            <TabsTrigger value="aave" className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]">
              Aave
            </TabsTrigger>
            <TabsTrigger value="lido" className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]">
              Lido
            </TabsTrigger>
            <TabsTrigger value="eigen" className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]">
              EigenLayer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="border-[#1e2134] bg-[#0d101f] mb-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    AI Yield Optimizer
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                      Auto-Rebalance: 
                      <Button
                        variant={autoRebalance ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoRebalance(!autoRebalance)}
                        className="ml-2"
                      >
                        {autoRebalance ? "On" : "Off"}
                      </Button>
                    </div>
                    <div className="text-sm text-gray-400">
                      Risk Level: {getRiskLabel(riskLevel)}
                      <Slider
                        value={[riskLevel]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={(value) => setRiskLevel(value[0])}
                        className="w-32 ml-2"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {yields.map((protocol) => {
                    const stats = getProtocolStats(protocol);
                    const isCurrentStrategy = currentStrategy?.protocol === protocol.protocol;
                    return (
                      <Card 
                        key={protocol.protocol}
                        className={`border ${isCurrentStrategy ? 'border-blue-500' : 'border-[#1e2134]'} bg-[#161a2c]`}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-lg">
                            <span>{protocol.protocol}</span>
                            {isCurrentStrategy && (
                              <span className="text-sm text-blue-500">Current Strategy</span>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">APY</span>
                              <span className="text-green-500">{stats.apy}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Net Return (Annual)</span>
                              <span className={Number(stats.annualizedReturn) > 0 ? 'text-green-500' : 'text-red-500'}>
                                {stats.annualizedReturn}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">TVL</span>
                              <span>${stats.tvl}B</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Risk Level</span>
                              <span className="text-yellow-500">{stats.risk}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Gas Cost (ETH)</span>
                              <span>{stats.gasEstimate}</span>
                            </div>
                          </div>
                          {!isCurrentStrategy && (
                            <Button
                              className="w-full mt-4"
                              onClick={() => handleRebalance(protocol)}
                              disabled={isRebalancing}
                            >
                              {isRebalancing ? 'Rebalancing...' : 'Switch to This Strategy'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {lastUpdate && (
                  <div className="text-sm text-gray-400 mt-4 text-center">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aave" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {yields
                .filter(protocol => protocol.protocol === 'Aave')
                .map(protocol => {
                  const stats = getProtocolStats(protocol);
                  const isCurrentStrategy = currentStrategy?.protocol === protocol.protocol;
                  return (
                    <Card 
                      key={protocol.protocol}
                      className={`border ${isCurrentStrategy ? 'border-blue-500' : 'border-[#1e2134]'} bg-[#161a2c]`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <span>{protocol.token}</span>
                            <span className="text-sm text-gray-400">on {protocol.protocol}</span>
                          </div>
                          {isCurrentStrategy && (
                            <span className="text-sm text-blue-500">Current Strategy</span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">APY</span>
                            <span className="text-green-500">{stats.apy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Net Return (Annual)</span>
                            <span className={Number(stats.annualizedReturn) > 0 ? 'text-green-500' : 'text-red-500'}>
                              {stats.annualizedReturn}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">TVL</span>
                            <span>${stats.tvl}B</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Gas Cost (ETH)</span>
                            <span>{stats.gasEstimate}</span>
                          </div>
                        </div>
                        {!isCurrentStrategy && (
                          <Button
                            className="w-full mt-4"
                            onClick={() => handleRebalance(protocol)}
                            disabled={isRebalancing}
                          >
                            {isRebalancing ? 'Rebalancing...' : 'Switch to This Strategy'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              }
            </div>
          </TabsContent>

          <TabsContent value="lido" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {yields
                .filter(protocol => protocol.protocol === 'Lido')
                .map(protocol => {
                  const stats = getProtocolStats(protocol);
                  const isCurrentStrategy = currentStrategy?.protocol === protocol.protocol;
                  return (
                    <Card 
                      key={protocol.protocol}
                      className={`border ${isCurrentStrategy ? 'border-blue-500' : 'border-[#1e2134]'} bg-[#161a2c]`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <span>{protocol.token}</span>
                            <span className="text-sm text-gray-400">on {protocol.protocol}</span>
                          </div>
                          {isCurrentStrategy && (
                            <span className="text-sm text-blue-500">Current Strategy</span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">APY</span>
                            <span className="text-green-500">{stats.apy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Net Return (Annual)</span>
                            <span className={Number(stats.annualizedReturn) > 0 ? 'text-green-500' : 'text-red-500'}>
                              {stats.annualizedReturn}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">TVL</span>
                            <span>${stats.tvl}B</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Gas Cost (ETH)</span>
                            <span>{stats.gasEstimate}</span>
                          </div>
                        </div>
                        {!isCurrentStrategy && (
                          <Button
                            className="w-full mt-4"
                            onClick={() => handleRebalance(protocol)}
                            disabled={isRebalancing}
                          >
                            {isRebalancing ? 'Rebalancing...' : 'Switch to This Strategy'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              }
            </div>
          </TabsContent>

          <TabsContent value="eigen" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {yields
                .filter(protocol => protocol.protocol === 'EigenLayer')
                .map(protocol => {
                  const stats = getProtocolStats(protocol);
                  const isCurrentStrategy = currentStrategy?.protocol === protocol.protocol;
                  return (
                    <Card 
                      key={protocol.protocol}
                      className={`border ${isCurrentStrategy ? 'border-blue-500' : 'border-[#1e2134]'} bg-[#161a2c]`}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-2">
                            <span>{protocol.token}</span>
                            <span className="text-sm text-gray-400">on {protocol.protocol}</span>
                          </div>
                          {isCurrentStrategy && (
                            <span className="text-sm text-blue-500">Current Strategy</span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">APY</span>
                            <span className="text-green-500">{stats.apy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Net Return (Annual)</span>
                            <span className={Number(stats.annualizedReturn) > 0 ? 'text-green-500' : 'text-red-500'}>
                              {stats.annualizedReturn}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">TVL</span>
                            <span>${stats.tvl}B</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Gas Cost (ETH)</span>
                            <span>{stats.gasEstimate}</span>
                          </div>
                        </div>
                        {!isCurrentStrategy && (
                          <Button
                            className="w-full mt-4"
                            onClick={() => handleRebalance(protocol)}
                            disabled={isRebalancing}
                          >
                            {isRebalancing ? 'Rebalancing...' : 'Switch to This Strategy'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              }
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
            {/* <YieldStrategies /> */}

            <Card className="border-[#1e2134] bg-[#0d101f]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#3b82f6]" />
          AI-Powered Yield Strategies
        </CardTitle>
        <CardDescription className="text-gray-300">
          Personalized recommendations based on your assets and risk preferences
          {yields.length > 0 ? (
            <div className="mt-2">
              <div className="text-sm text-gray-400">Available Protocols:</div>
              <ul className="mt-1 space-y-1">
                {yields.map((protocol) => (
                  <li key={protocol.protocol} className="flex justify-between text-sm">
                    <span>{protocol.protocol}</span>
                    <span className="text-green-500">{protocol.apy.toFixed(2)}% APY</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-gray-400 mt-2">Loading protocol data...</div>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Risk Preference</h3>
              <p className="text-xs text-gray-300">
                Adjust your risk tolerance to see different strategy recommendations
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-64">
              <Slider
                value={[riskLevel]}
                min={1}
                max={5}
                step={1}
                onValueChange={(value) => setRiskLevel(value[0])}
                className="w-full"
              />
              <span className="text-sm font-medium min-w-24 text-right">{getRiskLabel(riskLevel)}</span>
            </div>
          </div>

          <div className="w-full h-2 bg-[#161a2c] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#10b981] via-[#3b82f6] to-[#f43f5e]"
              style={{ width: `${(riskLevel / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <Tabs defaultValue="recommended" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 bg-[#161a2c]">
            <TabsTrigger
              value="recommended"
              className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]"
            >
              Recommended
            </TabsTrigger>
            <TabsTrigger
              value="highest-yield"
              className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]"
            >
              Highest Yield
            </TabsTrigger>
            <TabsTrigger
              value="lowest-risk"
              className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]"
            >
              Lowest Risk
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="space-y-4">
            <ActionCard
              id="strategy-1"
              icon={<Wallet className="h-5 w-5" />}
              iconColor="#3b82f6"
              title="Balanced ETH Yield Strategy"
              description="Optimize your ETH holdings across Lido and EigenLayer for balanced returns"
              actionText="Stake ETH"
              metricLabel="~4.2% APR"
              metricValue="Est. $420/year"
              assets={[
                { name: "ETH", protocol: "Lido", allocation: 70 },
                { name: "ETH", protocol: "EigenLayer", allocation: 30 },
              ]}
              isExecuting={isRebalancing}
              onExecute={handleRebalance}
              yields={yields}
            />

            <ActionCard
              id="strategy-2"
              icon={<ShieldCheck className="h-5 w-5" />}
              iconColor="#b980fa"
              title="Stablecoin Yield Maximizer"
              description="Optimize your USDC holdings on Aave with strategic position management"
              actionText="Optimize USDC"
              metricLabel="~2.8% APR"
              metricValue="Est. $146/year"
              assets={[{ name: "USDC", protocol: "Aave", allocation: 100 }]}
              isExecuting={isRebalancing}
              onExecute={handleRebalance}
              yields={yields}
            />
          </TabsContent>

          <TabsContent value="highest-yield" className="space-y-4">
            <ActionCard
              id="strategy-3"
              icon={<Zap className="h-5 w-5" />}
              iconColor="#3b82f6"
              title="ETH Yield Maximizer"
              description="Maximize ETH yield through strategic allocation across multiple protocols"
              actionText="Maximize Yield"
              metricLabel="~5.1% APR"
              metricValue="Est. $510/year"
              assets={[
                { name: "ETH", protocol: "Lido", allocation: 50 },
                { name: "ETH", protocol: "EigenLayer", allocation: 50 },
              ]}
              isExecuting={isRebalancing}
              onExecute={handleRebalance}
              yields={yields}
            />
          </TabsContent>

          <TabsContent value="lowest-risk" className="space-y-4">
            <ActionCard
              id="strategy-4"
              icon={<ShieldIcon className="h-5 w-5" />}
              iconColor="#10b981"
              title="Ultra-Safe Stablecoin Strategy"
              description="Maximize safety with minimal risk exposure for your stablecoin holdings"
              actionText="Secure USDC"
              metricLabel="~2.3% APR"
              metricValue="Est. $120/year"
              assets={[{ name: "USDC", protocol: "Aave", allocation: 100 }]}
              isExecuting={isRebalancing}
              onExecute={handleRebalance}
              yields={yields}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

          </div>
          <div className="space-y-6">
            {/* {/* <PerformanceMonitor /> */}
            <Card className="border-[#1e2134] bg-[#0d101f]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-[#3b82f6]" />
          Performance Monitor
        </CardTitle>
        <CardDescription className="text-gray-300">Track your yield performance over time</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="yield" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 bg-[#161a2c]">
            <TabsTrigger value="yield" className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]">
              Yield
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-[#0d101f] data-[state=active]:text-[#3b82f6]">
              Assets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yield">
            <div className="space-y-4">
              <div className="h-48 w-full relative">
                <div className="absolute inset-0 flex items-end">
                  <div className="w-full h-full flex items-end">
                    {/* Simulated chart with gradient bars */}
                    <div className="flex-1 h-[30%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div>
                    <div className="flex-1 h-[45%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div>
                    <div className="flex-1 h-[40%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div>
                    <div className="flex-1 h-[60%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div>
                    <div className="flex-1 h-[75%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div>
                    <div className="flex-1 h-[65%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div>
                    <div className="flex-1 h-[80%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div>
                  </div>
                </div>

                {/* Chart overlay with grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-[#1e2134] h-1/4"></div>
                  <div className="border-b border-[#1e2134] h-1/4"></div>
                  <div className="border-b border-[#1e2134] h-1/4"></div>
                  <div className="border-b border-[#1e2134] h-1/4"></div>
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 inset-y-0 flex flex-col justify-between items-start text-xs text-gray-400 pointer-events-none">
                  <span>5%</span>
                  <span>4%</span>
                  <span>3%</span>
                  <span>2%</span>
                  <span>1%</span>
                </div>

                {/* X-axis labels */}
                <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-gray-400 pt-2 pointer-events-none">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-3">
                  <p className="text-xs text-gray-300 mb-1">Current Yield</p>
                  <p className="text-xl font-medium text-[#10b981]">3.8%</p>
                </div>
                <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-3">
                  <p className="text-xs text-gray-300 mb-1">30d Change</p>
                  <p className="text-xl font-medium text-[#10b981]">+0.6%</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assets">
            <div className="space-y-4">
              <div className="h-48 w-full relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Simulated donut chart */}
                  <div className="w-32 h-32 rounded-full border-8 border-[#3b82f6] relative">
                    <div className="absolute inset-0 border-8 border-t-[#b980fa] border-r-[#b980fa] border-b-transparent border-l-transparent rounded-full transform rotate-45"></div>
                    <div className="absolute inset-0 border-8 border-t-transparent border-r-transparent border-b-[#06b6d4] border-l-[#06b6d4] rounded-full transform -rotate-45"></div>
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-0 inset-x-0 flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#3b82f6] rounded-full"></div>
                    <span className="text-gray-300">ETH (45%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#b980fa] rounded-full"></div>
                    <span className="text-gray-300">USDC (35%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#06b6d4] rounded-full"></div>
                    <span className="text-gray-300">WBTC (20%)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-3">
                  <p className="text-xs text-gray-300 mb-1">Total Value</p>
                  <p className="text-xl font-medium">$18,750</p>
                </div>
                <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-3">
                  <p className="text-xs text-gray-300 mb-1">30d Change</p>
                  <p className="text-xl font-medium text-[#10b981]">+12.4%</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

            
            {/* <AlertsPanel />  */}
          </div>
        </div>
      </main>
    </div>
  )
}



interface AssetCardProps {
    id: string
    name: string
    symbol: string
    balance: string
    value: string
    protocol: string
    apy: string
    risk: string
    expanded: boolean
    onToggle: () => void
  }
  
  function AssetCard({ id, name, symbol, balance, value, protocol, apy, risk, expanded, onToggle }: AssetCardProps) {
    const getRiskColor = (risk: string) => {
      switch (risk) {
        case "Very Low":
          return "bg-[#10b981]"
        case "Low":
          return "bg-[#3b82f6]"
        case "Medium":
          return "bg-[#f59e0b]"
        case "High":
          return "bg-[#f97316]"
        case "Very High":
          return "bg-[#f43f5e]"
        default:
          return "bg-gray-500"
      }
    }
  
    const getProtocolColor = (protocol: string) => {
      switch (protocol) {
        case "Aave":
          return "text-[#b980fa]"
        case "Lido":
          return "text-[#3b82f6]"
        case "EigenLayer":
          return "text-[#06b6d4]"
        default:
          return "text-gray-400"
      }
    }
  
    return (
      <div className="rounded-lg border border-[#1e2134] bg-[#111526]">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a1f36] flex items-center justify-center text-lg font-bold">
                {symbol.charAt(0)}
              </div>
              <div>
                <h3 className="font-medium">{name}</h3>
                <p className="text-sm text-gray-300">{symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">
                {balance} {symbol}
              </p>
              <p className="text-sm text-gray-300">{value}</p>
            </div>
          </div>
  
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${getProtocolColor(protocol)}`}>{protocol}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#161a2c]">{apy} APY</span>
            </div>
            <button onClick={onToggle} className="text-gray-300 hover:text-[#3b82f6] transition-colors">
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>
  
        {expanded && (
          <div className="px-4 pb-4 pt-2 border-t border-[#1e2134] bg-[#0a0c19]">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-300 mb-1">Risk Level</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getRiskColor(risk)}`}></span>
                  <span className="text-sm">{risk}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-300 mb-1">Current Yield</p>
                <p className="text-sm">{apy}</p>
              </div>
              <div>
                <p className="text-xs text-gray-300 mb-1">Protocol</p>
                <p className={`text-sm ${getProtocolColor(protocol)}`}>{protocol}</p>
              </div>
              <div>
                <p className="text-xs text-gray-300 mb-1">Liquidity</p>
                <div className="flex items-center gap-2">
                  <Progress value={85} className="h-2 w-16 bg-[#161a2c]" />
                  <span className="text-xs text-gray-300">High</span>
                </div>
              </div>
            </div>
  
            <a href="#" className="text-xs text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1">
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    )
  }
  



interface ActionCardProps {
    id: string
    icon: React.ReactNode
    iconColor: string
    title: string
    description: string
    actionText: string
    metricLabel: string
    metricValue: string
    assets: { name: string; protocol: string; allocation: number }[]
    isExecuting: boolean
    onExecute: (strategy: ProtocolYield) => void
    yields: ProtocolYield[]
  }
  
  function ActionCard({
    id,
    icon,
    iconColor,
    title,
    description,
    actionText,
    metricLabel,
    metricValue,
    assets,
    isExecuting,
    onExecute,
    yields,
  }: ActionCardProps) {
    const getProtocolColor = (protocol: string) => {
      switch (protocol) {
        case "Aave":
          return "text-[#b980fa]"
        case "Lido":
          return "text-[#3b82f6]"
        case "EigenLayer":
          return "text-[#06b6d4]"
        default:
          return "text-gray-400"
      }
    }
  
    const buttonText = isExecuting ? 'Executing...' : 'Execute Strategy'
  
    return (
      <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-4">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <div style={{ color: iconColor }}>{icon}</div>
          </div>
  
          <div className="flex-grow">
            <h3 className="text-lg font-medium mb-1">{title}</h3>
            <p className="text-gray-300 text-sm mb-3">{description}</p>
  
            <div className="space-y-1 mb-4">
              {assets.map((asset, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{asset.name}</span>
                    <span className={`text-xs ${getProtocolColor(asset.protocol)}`}>({asset.protocol})</span>
                  </div>
                  <span>{asset.allocation}%</span>
                </div>
              ))}
            </div>
  
            <Button
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              onClick={() => {
                // Find the protocol with highest allocation
                const primaryAsset = assets.reduce((prev, current) => 
                  prev.allocation > current.allocation ? prev : current
                );
                const strategy = yields.find(y => 
                  y.protocol === primaryAsset.protocol && 
                  y.token === primaryAsset.name
                );
                if (strategy) onExecute(strategy);
              }}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  Rebalancing...
                </div>
              ) : actionText}
            </Button>
          </div>
  
          <div className="flex-shrink-0 text-right">
            <p className="text-[#10b981] font-medium">{metricLabel}</p>
            <p className="text-gray-300 text-xs">{metricValue}</p>
          </div>
        </div>
      </div>
    )
  }
  
  function Wallet(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
        <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
      </svg>
    )
  }
  
  function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    )
  }
  
  function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
    )
  }
  
  