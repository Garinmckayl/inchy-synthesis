"use client"

import { useEffect, useState, useCallback } from "react"
import { parseUnits, formatUnits } from 'ethers';
import { Scan, ChevronDown, ChevronUp, ExternalLink, LineChart, AlertTriangle, Sparkles, Zap, CheckCircle2, Loader2 } from "lucide-react" // Added Loader2
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Navbar } from "@/components/navbar";
import { toast } from "@/components/ui/use-toast";
import { ProtocolYield, calculateNetApy } from "@/core/defi/protocols";
import { usePrivy } from "@privy-io/react-auth";

// Types for API responses
interface ApiResponse {
  yields: ProtocolYield[];
  gasPriceGwei: number;
  ethPriceUsd: number;
}

interface RecommendationResponse {
  recommendedProtocol: ProtocolYield | null;
  reason: string;
}

interface StrategyRecommendation {
  recommendedProtocol: 'Aave' | 'Lido' | 'EigenLayer' | 'None';
  reasoning: string;
  estimatedNetAPY: number;
  confidenceScore: number;
  warnings: string[];
  alternativeProtocols?: { protocol: string; reasonNotRecommended: string }[];
  strategyDetails: ProtocolYield | null; // Contains the full details if a protocol is recommended
}

export default function Home() {
  // State Variables
  const [yields, setYields] = useState<ProtocolYield[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<ProtocolYield | null>(null);
  const [recommendedStrategy, setRecommendedStrategy] = useState<StrategyRecommendation | null>(null);
  const [isExecuting, setIsExecuting] = useState(false); // Renamed from isRebalancing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [gasPriceGwei, setGasPriceGwei] = useState<number>(0);
  const [ethPriceUsd, setEthPriceUsd] = useState<number>(0);
  const [autoRebalance, setAutoRebalance] = useState(false); // Keep UI, logic needs backend
  const [riskLevel, setRiskLevel] = useState(2); // 1-5 scale
  const { user, ready, authenticated, login, getAccessToken } = usePrivy();

  // Fetch initial data (Yields, Current Strategy, Gas, ETH Price)
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!authenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to view data",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Error",
          description: "Could not get access token",
          variant: "destructive"
        });
        return;
      }

      const [yieldsResponse, currentStrategyResponse] = await Promise.all([
        fetch('/api/yield/protocols', {
           headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/yield/current', {
           headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Process Yields
      if (!yieldsResponse.ok) {
        const errorData = await yieldsResponse.json();
        throw new Error(errorData.message || `Failed to fetch yields: ${yieldsResponse.statusText}`);
      }
      const yieldsData = await yieldsResponse.json();
      setYields(yieldsData.yields || []);
      setGasPriceGwei(yieldsData.gasPriceGwei || 0);
      setEthPriceUsd(yieldsData.ethPriceUsd || 0);
      setLastUpdate(new Date());

      // Process Current Strategy
       if (!currentStrategyResponse.ok) {
        // Don't fail hard if current strategy isn't found (maybe user has none)
        console.warn(`Failed to fetch current strategy: ${currentStrategyResponse.statusText}`);
         const errorData = await currentStrategyResponse.json().catch(() => ({})); // Try to get error message
         if (currentStrategyResponse.status !== 404) { // Allow 404 (no strategy found)
             setError(errorData.message || "Failed to fetch current strategy");
         }
        setCurrentStrategy(null);
      } else {
          const strategyData = await currentStrategyResponse.json();
          setCurrentStrategy(strategyData.currentStrategy); // API returns { currentStrategy: ProtocolYield | null }
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError(error.message || "An unknown error occurred while fetching data.");
      toast({
        title: "Error Fetching Data",
        description: error.message || "Could not load initial data. Please refresh.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, getAccessToken]); // Add dependencies if needed, e.g., if auth token changes

  // Fetch AI Recommendation
  const fetchRecommendation = useCallback(async (currentRiskLevel: number) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Error",
          description: "Could not get access token",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/yield/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          riskLevel: currentRiskLevel,
          investmentAmount: 10000, // Default $10k for now
          timeHorizon: 12 // Default 12 months
        }),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || `Failed to fetch recommendation: ${response.statusText}`);
      }

      const recommendationData: StrategyRecommendation = await response.json();
      setRecommendedStrategy(recommendationData);

    } catch (error) {
      console.error('Error fetching recommendation:', error);
      setError(error.message || "An unknown error occurred while fetching recommendation.");
       toast({
        title: "AI Recommendation Error",
        description: error.message || "Could not get recommendation. Please try again.",
        variant: "destructive"
      });
    }
  }, [getAccessToken]);

  // Initial Data Load and Recommendation Fetch
  useEffect(() => {
    if (ready) {
      fetchInitialData().then(() => {
        // Fetch initial recommendation after loading data
        fetchRecommendation(riskLevel);
      });
      // Setup interval for refreshing yield data (not recommendations)
      const interval = setInterval(fetchInitialData, 300000); // Update yields every 5 minutes
      return () => clearInterval(interval);
    }
  }, [ready, fetchInitialData, riskLevel, fetchRecommendation, getAccessToken]); // Only depends on the fetch function itself initially

   // Fetch new recommendation when risk level changes
   useEffect(() => {
      // Don't fetch on initial load if already handled above
       if (!isLoading && ready) {
            fetchRecommendation(riskLevel);
       }
   }, [riskLevel, fetchRecommendation, isLoading, ready, getAccessToken]);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchInitialData();
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Strategy via API
  const handleExecuteStrategy = async (strategyToExecute: ProtocolYield) => {
    if (!strategyToExecute || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    if (!authenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to execute this strategy",
        variant: "destructive"
      });
      login();
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Error",
          description: "Could not get access token",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/yield/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newStrategy: strategyToExecute }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Execution failed: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: 'Execution Initiated',
        description: result.message || `Successfully initiated move to ${strategyToExecute.protocol}.`,
        variant: 'default'
      });
      // Fetch the updated state from the backend to be sure
      const currentStrategyResponse = await fetch('/api/current-strategy', {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if(currentStrategyResponse.ok) {
        const strategyData = await currentStrategyResponse.json();
         setCurrentStrategy(strategyData.currentStrategy);
      } else {
        // Fallback: update state based on the strategy we intended to execute
        setCurrentStrategy(strategyToExecute);
        console.warn("Execution reported success, but failed to re-fetch current strategy state.");
      }

    } catch (error) {
      console.error('Execution error:', error);
      setError(error.message || "An unknown error occurred during execution.");
      toast({
        title: 'Execution Failed',
        description: error.message || 'Please check console and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // --- UI Helper Functions ---
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

  const getRiskLevelClass = (riskLevel: string) => {
     switch (riskLevel?.toLowerCase()) { // Added optional chaining
      case 'low':
        return 'bg-green-500/10 text-green-400';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'high':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  // Calculate stats for display (can still be useful for the general list)
  const getProtocolDisplayStats = (protocol: ProtocolYield) => {
    const gasPriceWei = parseUnits(gasPriceGwei.toString(), 'gwei');
    const gasEstimateWei = BigInt(protocol.gasEstimate);
    const gasCostWei = gasPriceWei * gasEstimateWei;
    const gasCostEth = formatUnits(gasCostWei, 'ether');
    const gasCostUsd = parseFloat(gasCostEth) * ethPriceUsd;

    return {
      gasCostUsd,
      // Calculate net APY considering gas costs and rebalancing frequency
      netApy: calculateNetApy(protocol, gasPriceGwei, ethPriceUsd)
    };
  };

  // --- Render Logic ---
  if (!ready) return <div>Loading Privy...</div>;

  return (
    <div className="min-h-screen bg-[#080812] text-white">
         <Navbar onSubscribe={function (): void {
        throw new Error("Function not implemented.");
      } } />
      <main className="container mx-auto px-4 py-8">

        {/* Loading and Error Display */}
        {isLoading && (
            <div className="flex justify-center items-center my-6 p-4 bg-[#0d101f] border border-[#1e2134] rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                <span>Loading initial protocol and strategy data...</span>
            </div>
        )}
         {error && !isLoading && ( // Don't show error if actively loading
            <div className="my-6 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div>
                    <p className="font-semibold">An error occurred:</p>
                    <p className="text-sm">{error}</p>
                </div>
                <Button 
                  onClick={handleRetry}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  {isLoading ? 'Retrying...' : 'Retry'}
                </Button>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Asset Scanner / Available Protocols */}
             <Card className="border-[#1e2134] bg-[#0d101f]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-white" />
                    Available Yield Opportunities (ETH)
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                        Browse available protocols. AI recommendations are below.
                         {currentStrategy && ` Currently active strategy: ${currentStrategy.protocol}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {!isLoading && yields.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {yields.map((protocol) => {
                            const stats = getProtocolDisplayStats(protocol);
                            const isCurrent = currentStrategy?.protocol === protocol.protocol;
                            return (
                            <Card
                                key={protocol.protocol}
                                className={`border ${isCurrent ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-[#1e2134]'} bg-[#161a2c] overflow-hidden transition-all hover:border-gray-600`}
                            >
                                <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between text-lg">
                                    <span>{protocol.protocol}</span>
                                    {isCurrent && (
                                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                        Active Strategy
                                    </span>
                                    )}
                                </CardTitle>
                                </CardHeader>
                                <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                    <span className="text-gray-400">APY (Gross)</span>
                                    <span className="text-green-500 font-medium">{protocol.apy?.toFixed(2) ?? 'N/A'}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                    <span className="text-gray-400">TVL</span>
                                    <span className="font-medium">${(protocol.tvl / 1e9).toFixed(2) ?? 'N/A'}B</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Risk Level</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${getRiskLevelClass(protocol.riskLevel)}`}>
                                        {protocol.riskLevel}
                                    </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                    <span className="text-gray-400 whitespace-nowrap">Est. Gas (ETH)</span>
                                    <span className="font-medium text-xs">{stats.gasCostEth}</span>
                                    </div>
                                </div>
                                <Button
                                    className={`w-full mt-4 text-sm py-1.5 h-auto ${isCurrent ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    onClick={() => handleExecuteStrategy(protocol)}
                                    disabled={isExecuting || isCurrent}
                                    variant={isCurrent ? 'outline' : 'default'}
                                >
                                    {isExecuting ? (
                                        <><Loader2 className="h-4 w-4 animate-spin"/>Working...</>
                                     ) : isCurrent ? (
                                        'Current Strategy'
                                     ) : (
                                        'Switch to This Strategy'
                                    )}
                                </Button>
                                </CardContent>
                            </Card>
                            );
                        })}
                        </div>
                     ) : !isLoading && yields.length === 0 ? (
                         <p className="text-center text-gray-400 py-4">No yield protocols available or failed to load.</p>
                     ) : null } {/* Show nothing while loading */}

                    {lastUpdate && !isLoading && (
                        <div className="text-xs text-gray-500 mt-4 text-center">
                            Data last updated: {lastUpdate.toLocaleTimeString()} | Gas: {gasPriceGwei.toFixed(1)} Gwei | ETH: ${ethPriceUsd.toFixed(0)}
                        </div>
                    )}
                </CardContent>
                </Card>


            {/* AI-Powered Yield Strategies */}
             <Card className="border-[#1e2134] bg-[#0d101f]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#3b82f6]" />
                    AI Strategy Recommendation
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                    Personalized recommendation based on your assets and risk preferences. Adjust risk below.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Risk Slider */}
                    <div className="mb-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                            <h3 className="text-sm font-medium mb-1">Your Risk Preference</h3>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-64">
                            <Slider
                                value={[riskLevel]}
                                min={1}
                                max={5}
                                step={1}
                                onValueChange={(value) => setRiskLevel(value[0])} // Triggers fetchRecommendation via useEffect
                                className="w-full [&>span:first-child]:h-1 [&>span>span]:h-1 [&>span>span]:w-3 [&>span>span]:h-3 [&>span>span]:border-2]" // Basic styling adjustment
                                disabled={isLoading}
                            />
                            <span className="text-sm font-medium min-w-[120px] text-right">{getRiskLabel(riskLevel)}</span>
                            </div>
                        </div>
                         <div className="w-full h-1 bg-[#161a2c] rounded-full overflow-hidden">
                            <div
                            className="h-full bg-gradient-to-r from-[#10b981] via-[#3b82f6] to-[#f43f5e] transition-all duration-300"
                            style={{ width: `${((riskLevel -1) / 4) * 100}%` }} // Adjusted for 1-5 scale
                            ></div>
                        </div>
                    </div>

                     {/* Recommendation Display */}
                     {recommendedStrategy && recommendedStrategy.recommendedProtocol !== 'None' && recommendedStrategy.strategyDetails && (
                        <ActionCard
                            id={`strategy-${recommendedStrategy.recommendedProtocol}`} // Dynamic ID
                            icon={<Zap className="h-5 w-5" />} // Use a default icon or map based on protocol
                            iconColor="#3b82f6"
                            title={`AI Recommended: ${recommendedStrategy.recommendedProtocol}`}
                            description={recommendedStrategy.reasoning}
                            actionText={`Execute ${recommendedStrategy.recommendedProtocol} Strategy`}
                            metricLabel={`~${recommendedStrategy.estimatedNetAPY.toFixed(2)}% Net APY`}
                            metricValue={`Confidence: ${recommendedStrategy.confidenceScore}/100`}
                            assets={[ // Reconstruct from strategyDetails
                                { name: recommendedStrategy.strategyDetails.token, // Or map based on protocol if needed
                                  protocol: recommendedStrategy.strategyDetails.protocol,
                                  allocation: 100 // Assuming single protocol recommendation for now
                                }
                            ]}
                            isExecuting={isExecuting}
                            onExecute={() => handleExecuteStrategy(recommendedStrategy.strategyDetails!)} // Pass the details object
                           // yields={yields} // Pass yields if needed by ActionCard internal logic, otherwise remove
                           warnings={recommendedStrategy.warnings} // Pass warnings
                        />
                    )}

                    {recommendedStrategy && recommendedStrategy.recommendedProtocol === 'None' && (
                         <div className="text-center text-gray-400 border border-dashed border-gray-600 p-6 rounded-lg bg-[#111526]">
                            <Zap className="h-8 w-8 mx-auto mb-3 text-gray-500" />
                            <h4 className="font-semibold mb-1">No Optimal Strategy Found</h4>
                            <p className="text-sm">{recommendedStrategy.reasoning || "Based on your current risk level and market conditions, the AI doesn't recommend deploying funds right now (e.g., gas costs too high, no suitable risk/reward). Try adjusting your risk level."}</p>
                         </div>
                    )}

                    {!recommendedStrategy && !error && (
                         <p className="text-center text-gray-500 py-4">Adjust risk slider to get AI recommendation.</p>
                    )}
                     {error && ( // Show specific recommendation error here if needed
                        <p className="text-center text-red-400 py-4">Could not load AI recommendation.</p>
                    )}


                </CardContent>
                </Card>

          </div>
          <div className="space-y-6">
            {/* Performance Monitor & Alerts Panel (Keep as is, data is static/simulated) */}
            <PerformanceMonitor />
            <AlertsPanel />
          </div>
        </div>
      </main>
    </div>
  )
}


// --- Child Components (Modified ActionCard, others kept as is) ---

interface ActionCardProps {
    id: string
    icon: React.ReactNode
    iconColor: string
    title: string
    description: string
    actionText: string
    metricLabel: string
    metricValue: string // Changed to string to accommodate confidence score etc.
    assets: { name: string; protocol: string; allocation: number }[]
    isExecuting: boolean
    onExecute: () => void // Simplified from original, takes no args now
    // yields: ProtocolYield[] // Removed, not needed if execution logic is external
    warnings?: string[] // Added warnings prop
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
    warnings
  }: ActionCardProps) {
    const getProtocolColor = (protocol: string) => {
       switch (protocol) {
        case "Aave": return "text-[#b980fa]";
        case "Lido": return "text-[#3b82f6]";
        case "EigenLayer": return "text-[#06b6d4]";
        default: return "text-gray-400";
      }
    }

    const currentStrategy = assets[0]; // Assuming single asset/protocol per recommendation card for now

    return (
      <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-1"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <div style={{ color: iconColor }}>{icon}</div>
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            <h3 className="text-lg font-medium mb-1">{title}</h3>
            <p className="text-gray-300 text-sm mb-3">{description}</p>

            {/* Asset Breakdown (simplified for single recommendation) */}
             <div className="space-y-1 mb-4 text-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-300">
                        <span>Asset: {currentStrategy.name}</span>
                        <span className={`${getProtocolColor(currentStrategy.protocol)}`}>
                            ({currentStrategy.protocol})
                        </span>
                    </div>
                    {/* <span>{currentStrategy.allocation}% Allocation</span> */}
                </div>
            </div>

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="mb-4 p-3 border border-yellow-700 bg-yellow-900/30 rounded-md text-yellow-300 text-xs space-y-1">
                    <p className="font-medium flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 inline-block" /> Risks:</p>
                    <ul className="list-disc list-inside pl-1">
                        {warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}

            <Button
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              onClick={onExecute} // Calls the passed function directly
              disabled={isExecuting}
            >
              {isExecuting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executing...
                </div>
              ) : (
                actionText
              )}
            </Button>
          </div>

          {/* Metrics */}
          <div className="flex-shrink-0 text-right space-y-1 mt-1 w-full sm:w-auto">
            <p className="text-[#10b981] font-medium text-base sm:text-lg">{metricLabel}</p>
            <p className="text-gray-400 text-xs">{metricValue}</p>
          </div>
        </div>
      </div>
    )
}


// --- Placeholder Components (Keep your existing implementations) ---

function PerformanceMonitor() {
  // Keep your existing PerformanceMonitor component code here
   // (Using the static/simulated chart from your original code)
    return (
     <Card className="border-[#1e2134] bg-[#0d101f]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-[#3b82f6]" />
          Performance Monitor
        </CardTitle>
        <CardDescription className="text-gray-300">Track your yield performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        {/* ... Keep the existing Tabs and Chart simulation ... */}
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
              <div className="h-48 w-full relative"> {/* Chart Simulation */}
                 <div className="absolute inset-0 flex items-end"> <div className="w-full h-full flex items-end"> <div className="flex-1 h-[30%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div> <div className="flex-1 h-[45%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div> <div className="flex-1 h-[40%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div> <div className="flex-1 h-[60%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div> <div className="flex-1 h-[75%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div> <div className="flex-1 h-[65%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div> <div className="flex-1 h-[80%] bg-gradient-to-t from-[#3b82f6] to-transparent rounded-sm"></div> </div> </div>
                 <div className="absolute inset-0 flex flex-col justify-between pointer-events-none"> <div className="border-b border-[#1e2134] h-1/4"></div> <div className="border-b border-[#1e2134] h-1/4"></div> <div className="border-b border-[#1e2134] h-1/4"></div> <div className="border-b border-[#1e2134] h-1/4"></div> </div>
                 <div className="absolute left-0 inset-y-0 flex flex-col justify-between items-start text-xs text-gray-400 pointer-events-none"> <span>5%</span> <span>4%</span> <span>3%</span> <span>2%</span> <span>1%</span> </div>
                 <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-gray-400 pt-2 pointer-events-none"> <span>Jan</span> <span>Feb</span> <span>Mar</span> <span>Apr</span> <span>May</span> <span>Jun</span> <span>Jul</span> </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-3"> <p className="text-xs text-gray-300 mb-1">Current Yield</p> <p className="text-xl font-medium text-[#10b981]">3.8%</p> </div>
                <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-3"> <p className="text-xs text-gray-300 mb-1">30d Change</p> <p className="text-xl font-medium text-[#10b981]">+0.6%</p> </div>
              </div>
            </div>
          </TabsContent>
          {/* ... Keep other tabs content ... */}
           <TabsContent value="assets">
             {/* Keep your asset chart simulation */}
              <div className="space-y-4">
              <div className="h-48 w-full relative">
                <div className="absolute inset-0 flex items-center justify-center"> {/* Donut Chart Simulation */}
                  <div className="w-32 h-32 rounded-full border-8 border-[#3b82f6] relative"> <div className="absolute inset-0 border-8 border-t-[#b980fa] border-r-[#b980fa] border-b-transparent border-l-transparent rounded-full transform rotate-45"></div> <div className="absolute inset-0 border-8 border-t-transparent border-r-transparent border-b-[#06b6d4] border-l-[#06b6d4] rounded-full transform -rotate-45"></div> </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 flex justify-center gap-4 text-xs"> {/* Legend */}
                  <div className="flex items-center gap-1"> <div className="w-3 h-3 bg-[#3b82f6] rounded-full"></div> <span className="text-gray-300">ETH (45%)</span> </div>
                  <div className="flex items-center gap-1"> <div className="w-3 h-3 bg-[#b980fa] rounded-full"></div> <span className="text-gray-300">USDC (35%)</span> </div>
                  <div className="flex items-center gap-1"> <div className="w-3 h-3 bg-[#06b6d4] rounded-full"></div> <span className="text-gray-300">WBTC (20%)</span> </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4"> {/* Asset Stats */}
                 <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-3"> <p className="text-xs text-gray-300 mb-1">Total Value</p> <p className="text-xl font-medium">$18,750</p> </div>
                 <div className="rounded-lg border border-[#1e2134] bg-[#111526] p-3"> <p className="text-xs text-gray-300 mb-1">30d Change</p> <p className="text-xl font-medium text-[#10b981]">+12.4%</p> </div>
               </div>
             </div>
           </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    );
}

function AlertsPanel() {
  // Keep your existing AlertsPanel component code here
  // (Likely static or simulated for now)
  return (
    <Card className="border-[#1e2134] bg-[#0d101f]">
       <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Alerts & Notifications
        </CardTitle>
        <CardDescription className="text-gray-300">Important updates about your portfolio</CardDescription>
      </CardHeader>
       <CardContent className="space-y-3">
         <div className="flex items-start gap-3 p-3 bg-[#111526] border border-[#1e2134] rounded-lg">
             <Zap className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0"/>
             <p className="text-xs text-gray-300">AI Recommendation: Consider shifting portion of ETH from Lido to EigenLayer for potential higher yield (Risk: Medium).</p>
         </div>
         <div className="flex items-start gap-3 p-3 bg-[#111526] border border-[#1e2134] rounded-lg">
             <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0"/>
             <p className="text-xs text-gray-300">Successfully staked 0.5 ETH to Lido.</p>
         </div>
         <div className="flex items-start gap-3 p-3 bg-[#111526] border border-[#1e2134] rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0"/>
             <p className="text-xs text-gray-300">High gas fee warning: Current gas price is above 60 Gwei.</p>
         </div>
       </CardContent>
    </Card>
  );
}

// Keep AssetCard if used elsewhere, or remove if not needed
// function AssetCard(...) { ... }

// Keep utility SVG components (Wallet, ShieldIcon, ShieldCheck) if used by static parts
// function Wallet(...) { ... }
// function ShieldIcon(...) { ... }
// function ShieldCheck(...) { ... }


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
  
  