// core/portfolio/portfolioService.ts
import { ZodError, z } from "zod";
import { ethers } from 'ethers';
// Assuming getUrlString for Ethplorer is in lib/externalApiUtils.ts
import { getUrlString } from '@/lib/urlUtils';

// --- Environment Variables ---
const ZAPPER_API_KEY = process.env.ZAPPER_API_KEY;
const ETHPLORER_API_KEY = process.env.ETHPLORER_API_KEY || 'freekey'; // Use 'freekey' or your actual key

// --- Zapper Config ---
const ZAPPER_API_BASE = 'https://api.zapper.xyz/v2';
const ZapperTokenSchema = z.object({ /* ... Zapper token schema ... */ }).passthrough();
const ZapperAppPositionSchema = z.object({ /* ... Zapper position schema ... */ }).passthrough();

// --- Unified Output Structure ---
// We add a dataSource field and make defiPositions optional
export interface WalletDataResult {
    dataSource: 'Zapper' | 'Ethplorer' | 'Error';
    address: string;
    networks: string[];
    totalValueUSD: number | null; // Can be null if only Ethplorer worked partially
    tokenBalances: Array<{
        address: string;
        name: string;
        symbol: string;
        balance: number;
        usdValue: number;
        price?: number | null;
    }> | null;
    defiPositions?: Array<{ // Optional for Ethplorer fallback
        protocol: string;
        positionLabel: string;
        totalValueUSD: number;
        underlyingAssets: Array<{ symbol: string; address: string; usdValue: number }>;
    }> | null;
    portfolioSummary?: { // Optional
        allocationPercentage?: { tokens: number; defi: number };
        dominantProtocols?: string[];
        dominantTokens?: string[];
    } | null;
    error?: string; // Include error message if dataSource is 'Error'
}

// --- Zapper Fetching Logic ---
async function fetchFromZapperAPI(endpoint: string, params: Record<string, any>): Promise<any> {
    // (Keep the fetchFromZapper logic from the previous example, ensuring it throws errors on failure)
    if (!ZAPPER_API_KEY) throw new Error("ZAPPER_API_KEY missing.");
    const queryParams = new URLSearchParams();
    for (const key in params) { /* ... handle arrays ... */ }
    queryParams.append('api_key', ZAPPER_API_KEY);
    const url = `${ZAPPER_API_BASE}${endpoint}?${queryParams.toString()}`;
    const response = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!response.ok) { /* ... handle error, throw ... */ }
    return response.json();
}

async function processZapperData(address: string, networks: string[], tokenData: any[], positionData: any[]): Promise<WalletDataResult | null> {
    console.log(`[Zapper Processor] Processing data for ${address}`);
    try {
        // (Keep the processing logic from the previous example)
        const processedTokens = tokenData?.map(/* ... parse with ZapperTokenSchema ... */).filter(/* ... */);
        const processedPositions = positionData?.map(/* ... parse with ZapperAppPositionSchema ... */).filter(/* ... */);
        const totalValueTokens = processedTokens?.reduce(/* ... */) || 0;
        const totalValueDeFi = processedPositions?.reduce(/* ... */) || 0;
        const totalValueUSD = totalValueTokens + totalValueDeFi;
        const allocation = totalValueUSD > 0 ? { tokens: totalValueTokens / totalValueUSD * 100, defi: totalValueDeFi / totalValueUSD * 100 } : undefined;

        return {
            dataSource: 'Zapper',
            address,
            networks,
            totalValueUSD,
            tokenBalances: processedTokens || [],
            defiPositions: processedPositions || [], // Include DeFi positions
            portfolioSummary: { allocationPercentage: allocation, /* ... dominant tokens/protocols ... */ },
        };
    } catch (error: any) {
        console.error(`[Zapper Processor] Error processing Zapper data for ${address}:`, error);
        return null; // Indicate processing failure
    }
}


// --- Ethplorer Fetching & Processing Logic ---
async function fetchFromEthplorerAPI(address: string): Promise<any> {
    const network = 'Ethereum'; // Ethplorer primarily Ethereum
    const url = getUrlString(network, 'getAddressInfo', address); // Ensure getUrlString includes ETHPLORER_API_KEY
    console.log(`[Ethplorer Service] Fetching from URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) { /* ... handle error, throw ... */ }
    return response.json();
}

function processEthplorerData(address: string, ethplorerJson: any): WalletDataResult | null {
    console.log(`[Ethplorer Processor] Processing data for ${address}`);
    try {
        if (!ethplorerJson || !ethplorerJson.address) return null;
        const processedTokens = (ethplorerJson.tokens || [])
            .map((token: any) => {
                try {
                    const decimals = parseInt(token.tokenInfo?.decimals || '18');
                    const balance = token.balance / (10 ** decimals);
                    const price = token.tokenInfo?.price?.rate;
                    const usdValue = price * balance || 0;
                    return {
                        address: token.tokenInfo?.address,
                        name: token.tokenInfo?.name,
                        symbol: token.tokenInfo?.symbol,
                        balance: balance,
                        usdValue: usdValue,
                        price: price,
                    };
                } catch { return null; }
            })
            .filter((t: any): t is NonNullable<typeof t> => t !== null && t.usdValue > 0.01); // Lower dust threshold

        // Add ETH balance if present
        if (ethplorerJson.ETH?.balance > 0 && ethplorerJson.ETH?.price?.rate) {
             processedTokens.unshift({ // Add ETH at the start
                 address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Common placeholder for ETH
                 name: 'Ethereum',
                 symbol: 'ETH',
                 balance: ethplorerJson.ETH.balance,
                 usdValue: ethplorerJson.ETH.price.rate * ethplorerJson.ETH.balance,
                 price: ethplorerJson.ETH.price.rate
             });
        }

        const totalValueUSD = processedTokens?.reduce((sum, t) => sum + t.usdValue, 0) || 0;

        return {
            dataSource: 'Ethplorer',
            address,
            networks: ['ethereum'], // Ethplorer source implies Ethereum
            totalValueUSD: totalValueUSD,
            tokenBalances: processedTokens || [],
            defiPositions: null, // Explicitly null as Ethplorer doesn't provide this
            portfolioSummary: {
                dominantTokens: processedTokens?.slice(0, 5).map(t => t.symbol) || [], // Only token info available
            },
        };
    } catch (error: any) {
        console.error(`[Ethplorer Processor] Error processing Ethplorer data for ${address}:`, error);
        return null; // Indicate processing failure
    }
}


// --- Main Service Function with Fallback ---
export async function fetchComprehensiveWalletData(
    address: string,
    networks: string[] = ['ethereum'] // Default networks for Zapper
): Promise<WalletDataResult> { // Always returns WalletDataResult, potentially with error state
    console.log(`[Wallet Service] Fetching comprehensive data for ${address}. Primary: Zapper, Fallback: Ethplorer`);

    // 1. Try Zapper First
    try {
        console.log(`[Wallet Service] Attempting Zapper for ${address}...`);
        const [tokenData, positionData] = await Promise.all([
            fetchFromZapperAPI('/balances/tokens', { addresses: [address], networks: networks }),
            fetchFromZapperAPI('/balances/app-positions', { addresses: [address], networks: networks })
        ]);

        const zapperResult = await processZapperData(address, networks, tokenData, positionData);
        if (zapperResult) {
            console.log(`[Wallet Service] Successfully fetched and processed Zapper data for ${address}.`);
            return zapperResult;
        }
         console.warn(`[Wallet Service] Zapper data processing failed for ${address}, proceeding to fallback.`);
         // Don't throw, just let it proceed to fallback

    } catch (zapperError: any) {
        console.warn(`[Wallet Service] Zapper API failed for ${address}: ${zapperError.message}. Attempting Ethplorer fallback...`);
        // Log the error but proceed to fallback
    }

    // 2. Try Ethplorer as Fallback (only if Zapper failed)
    // Note: Ethplorer mainly supports Ethereum
    if (networks.includes('ethereum') || networks.length === 1 && networks[0] === 'ethereum') {
        try {
            console.log(`[Wallet Service] Attempting Ethplorer fallback for ${address}...`);
            const ethplorerJson = await fetchFromEthplorerAPI(address);
            const ethplorerResult = processEthplorerData(address, ethplorerJson);
            if (ethplorerResult) {
                console.log(`[Wallet Service] Successfully fetched and processed Ethplorer data for ${address}.`);
                return ethplorerResult; // Return limited Ethplorer data
            }
             console.error(`[Wallet Service] Ethplorer data processing failed for ${address}.`);
             // Fall through to final error state

        } catch (ethplorerError: any) {
            console.error(`[Wallet Service] Ethplorer API failed for ${address}: ${ethplorerError.message}. No data available.`);
             // Fall through to final error state
        }
    } else {
         console.warn(`[Wallet Service] Skipping Ethplorer fallback for ${address} as network is not Ethereum.`);
    }


    // 3. If both failed, return Error state
    console.error(`[Wallet Service] Both Zapper and Ethplorer failed for ${address}.`);
    return {
        dataSource: 'Error',
        address: address,
        networks: networks,
        totalValueUSD: null,
        tokenBalances: null,
        defiPositions: null,
        portfolioSummary: null,
        error: "Failed to fetch wallet data from all available sources."
    };
}