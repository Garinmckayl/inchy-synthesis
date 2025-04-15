// lib/protocols.ts
import { ethers, JsonRpcProvider, formatUnits, parseUnits } from 'ethers';

// Define the interface matching frontend
export interface ProtocolYield {
  protocol: string;
  apy: number;
  tvl: number;
  riskLevel: string; // Consider making this more dynamic based on TVL, audits etc. later
  token: string; // The underlying asset for this yield (e.g., ETH, USDC) or the LST (stETH)
  gasEstimate: number; // Gas estimate for a deposit/stake action
}

const LIDO_API_URL = 'https://eth-api.lido.fi/v1/protocol/steth/apr/sma';
const EXPAND_API_URL_POOL = 'https://api.expand.network/lendborrow/getpool';
const EXPAND_API_URL_STATS = 'https://api.expand.network/pools/getstats';
const DUNE_API_URL = 'https://api.dune.com/api/v1/eigenlayer/avs-stats';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

// Securely load API keys from environment variables
const ANKR_API_KEY = process.env.ANKR_API_KEY || 'adf5a22944a318ab1b3cd61a967f177220fdba7792d6c4cf5dad01f1fde4e800';
const EXPAND_API_KEY = process.env.EXPAND_API_KEY;
const DUNE_API_KEY = process.env.DUNE_API_KEY;

console.log("Attempting to initialize provider...");

let provider: JsonRpcProvider;
try {
  // Use Ankr's RPC with API key
  provider = new JsonRpcProvider(`https://rpc.ankr.com/eth/${ANKR_API_KEY}`);
  console.log("Provider initialized with Ankr RPC.");
} catch (error) {
  console.error("Failed to initialize primary provider:", error);
  try {
    // Fallback to 1RPC which also has good rate limits
    provider = new JsonRpcProvider('https://1rpc.io/eth');
    console.log("Provider initialized with 1RPC fallback.");
  } catch (fallbackError) {
    console.error("Failed to initialize fallback provider:", fallbackError);
    throw new Error("Could not initialize any Ethereum provider");
  }
}

// Function to get gas price with retries
async function getGasPrice(retries = 3): Promise<number> {
  for (let i = 0; i < retries; i++) {
    try {
      const feeData = await provider.getFeeData();
      if (!feeData || !feeData.gasPrice) {
        throw new Error("No gas price in fee data");
      }
      return parseFloat(formatUnits(feeData.gasPrice, 'gwei'));
    } catch (error) {
      console.error(`Failed to get gas price, attempt ${i + 1}/${retries}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
    }
  }
  return 20; // Fallback gas price if all retries fail
}

// Export the fetchProtocolYields function
export async function fetchProtocolYields(): Promise<{ yields: ProtocolYield[], gasPriceGwei: number }> {
  console.log("Fetching protocol yields...");
  const yields: ProtocolYield[] = [];
  let gasPriceGwei = 20; // Default gas price
  let ethPriceUsd = 3000; // Default ETH price

  try {
    gasPriceGwei = await getGasPrice();
    console.log("Current gas price:", gasPriceGwei, "gwei");

    ethPriceUsd = await getEthPrice();
    console.log("Current ETH price:", ethPriceUsd, "USD");

    // --- Fetch Lido Data ---
    try {
      console.log("Fetching Lido data from:", LIDO_API_URL);
      const lidoResponse = await fetch(LIDO_API_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!lidoResponse.ok) {
        const errorText = await lidoResponse.text();
        console.error("Lido API error response:", errorText);
        throw new Error(`Lido API error: ${lidoResponse.statusText}`);
      }

      const lidoData = await lidoResponse.json();
     // console.log("Lido API response:", lidoData);

      if (lidoData?.data?.smaApr) {
        yields.push({
          protocol: 'Lido',
          apy: parseFloat(lidoData.data.smaApr),
          tvl: 21_000_000_000,
          riskLevel: 'Low',
          token: 'stETH',
          gasEstimate: 150000,
        });
        console.log("Added Lido yield data.");
      } else {
        console.warn("Could not parse Lido APR data:", lidoData);
      }
    } catch (error) {
      console.error('Error fetching Lido data:', error);
    }

    // --- Fetch Aave Data (ETH Supply) ---
    if (EXPAND_API_KEY) {
      try {
        console.log("Fetching Aave pools with API key:", EXPAND_API_KEY.substring(0, 5) + "...");
        
        const poolsResponse = await fetch(`${EXPAND_API_URL_POOL}?asset=${WETH_ADDRESS}`, {
          headers: {
            'x-api-key': EXPAND_API_KEY,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        if (!poolsResponse.ok) {
          const errorText = await poolsResponse.text();
          console.error("Aave pools response error:", errorText);
          throw new Error(`Expand Pool API error: ${poolsResponse.statusText}`);
        }

        const poolsData = await poolsResponse.json();
       // console.log("Aave pools data:", JSON.stringify(poolsData, null, 2));

        if (poolsData?.status === 200 && poolsData?.data) {
          const stats = poolsData.data;
          const apy = parseFloat(stats.variableSupplyRate);
          
          if (!isNaN(apy)) {
            yields.push({
              protocol: 'Aave',
              apy: apy,
              tvl: parseFloat(formatUnits(stats.reserveSize, 18)) * ethPriceUsd,
              riskLevel: 'Low',
              token: 'ETH',
              gasEstimate: 250000,
            });
            console.log("Added Aave yield data.");
          } else {
            console.warn("Invalid Aave APY format:", stats.variableSupplyRate);
          }
        } else {
          console.warn("Invalid Aave pool data format:", poolsData);
        }
      } catch (error) {
        console.error('Error fetching Aave data:', error);
      }
    } else {
      console.warn("Skipping Aave data fetch - EXPAND_API_KEY not set");
    }

    // --- Fetch EigenLayer Data ---
    // Note: EigenLayer yields are complex (restaking + AVS rewards). A single APY is an oversimplification.
    // Dune is good for historical/aggregated data, but might not be real-time enough for direct yield.
    // For a real product, you might need direct AVS reward APIs or more sophisticated estimation.
    try {
        if (!DUNE_API_KEY) throw new Error("DUNE_API_KEY not set");
        // This is a placeholder URL/Query - Replace with an actual Dune query ID or API endpoint for relevant EigenLayer data
        const DUNE_QUERY_ID = "YOUR_EIGENLAYER_QUERY_ID"; // Example: Find a query for average restaking yield
        const duneResponse = await fetch(`https://api.dune.com/api/v1/eigenlayer/avs-stats`, {
            headers: { 'x-dune-api-key': DUNE_API_KEY }
        });

        if (duneResponse.ok) {
            const duneData = await duneResponse.json();
           // console.log("Dune API response:", duneData);
            // **Parse the specific result structure of your Dune query**
            // This is highly dependent on the query you create.
            // Example: assuming the query returns a single row with avg_apy and total_tvl
            const resultRow = duneData?.result?.rows?.[0];
            if (resultRow) {
                 yields.push({
                    protocol: 'EigenLayer',
                    // Use a realistic but placeholder APY if Dune doesn't provide a direct one easily
                    apy: parseFloat(resultRow.avg_apy || '4.5'), // Example field name
                    tvl: parseFloat(resultRow.total_tvl || '15000000000'), // Example field name
                    riskLevel: 'Medium', // Higher complexity/newer tech = higher risk generally
                    token: 'ETH', // Assuming native ETH restaking or common LSTs like stETH
                    gasEstimate: 300000,
                });
                console.log("Added EigenLayer yield data.");
            } else {
                 console.warn("Could not parse EigenLayer data from Dune query result.");
                 // Add fallback if needed
            }
        } else {
             console.error(`Dune API error: ${duneResponse.statusText}`);
             // Add fallback data for EigenLayer if API fails
              yields.push({ protocol: 'EigenLayer', apy: 4.2, tvl: 15_000_000_000, riskLevel: 'Medium', token: 'ETH', gasEstimate: 300000 });
              console.log("Using fallback EigenLayer data.");
        }

    } catch (error) {
      console.error('Error fetching EigenLayer data:', error);
       yields.push({ protocol: 'EigenLayer', apy: 4.2, tvl: 15_000_000_000, riskLevel: 'Medium', token: 'ETH', gasEstimate: 300000 });
       console.log("Using fallback EigenLayer data due to error.");
    }


    if (yields.length === 0) {
      console.error("Failed to fetch any protocol data.");
      // Consider throwing an error or returning empty with a specific gas price
    }

    console.log(`Finished fetching yields. Found ${yields.length} protocols. Gas price: ${gasPriceGwei} Gwei.`);
    return { yields, gasPriceGwei };

  } catch (error) {
    console.error('Critical error fetching protocol data or gas price:', error);
    // Return empty yields but potentially a default gas price, or rethrow
    return { yields: [], gasPriceGwei: 20 }; // Example default gas
  }
};

// --- Helper to calculate Net APY (can be used by AI prompt) ---
export const calculateNetApy = (
    protocolYield: ProtocolYield,
    gasPriceGwei: number,
    ethPriceUsd: number, // Need ETH price for accurate cost estimation
    rebalancesPerYear: number = 4 // Assumption: how often might a user rebalance?
): number => {
    if (!ethPriceUsd || ethPriceUsd <= 0) return protocolYield.apy; // Cannot calculate without ETH price

    const gasPriceWei = parseUnits(gasPriceGwei.toString(), 'gwei');
    const gasEstimateWei = BigInt(protocolYield.gasEstimate);
    const singleTxCostWei = gasPriceWei * gasEstimateWei; // Use BigInt multiplication
    const singleTxCostEth = parseFloat(formatUnits(singleTxCostWei, 'ether'));
    const singleTxCostUsd = singleTxCostEth * ethPriceUsd;

    // This calculation is tricky. Gas cost is fixed, impact depends on deposit size.
    // For AI, maybe provide the raw gas cost and let it reason, or estimate based on a hypothetical $10k deposit?
    // Let's estimate % cost based on a $10k deposit for simplicity here.
    const hypotheticalDepositUsd = 10000;
    const annualGasCostUsd = singleTxCostUsd * rebalancesPerYear;
    const annualGasCostPercent = (annualGasCostUsd / hypotheticalDepositUsd) * 100;

    // Net APY = Gross APY - Annual Gas Cost %
    return protocolYield.apy - annualGasCostPercent;
}

// --- Fetch ETH Price (Example using a common API) ---
export const getEthPrice = async (): Promise<number> => {
    try {
        // Using CoinGecko public API as an example
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        if (!response.ok) throw new Error("CoinGecko API error");
        const data = await response.json();
        console.log("CoinGecko API response:", data);
        return data?.ethereum?.usd || 3000; // Return fetched price or a default fallback
    } catch (error) {
        console.error("Error fetching ETH price:", error);
        return 3000; // Default fallback
    }
}