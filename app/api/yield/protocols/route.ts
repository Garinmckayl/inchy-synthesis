// app/api/yield/protocols/route.ts
import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest and NextResponse
import { fetchProtocolYields, ProtocolYield, getEthPrice } from '@/core/defi/protocols'; // Adjust path

// --- Basic in-memory cache (keep as is or improve) ---
interface CacheData {
  yields: ProtocolYield[];
  gasPriceGwei: number;
  ethPriceUsd: number;
}
let cache = {
  data: null as CacheData | null,
  lastUpdated: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
// --- End Cache ---

// Export a named function for the GET method
export async function GET(req: NextRequest) { // Use GET and NextRequest
  const now = Date.now();

  // Serve from cache if valid
  if (cache.data && now - cache.lastUpdated < CACHE_DURATION) {
    console.log("[API Yield Protocols] Serving from cache.");
    return NextResponse.json(cache.data); // Use NextResponse.json
  }

  console.log("[API Yield Protocols] Cache expired or empty, fetching fresh data...");
  try {
    console.log("[API Yield Protocols] Starting data fetch...");
    const [protocolData, ethPrice] = await Promise.all([
        fetchProtocolYields(), // Ensure this is edge-compatible if using edge runtime
        getEthPrice()      // Ensure this is edge-compatible if using edge runtime
    ]);

    console.log("[API Yield Protocols] Data fetched:", { protocolData, ethPrice });

    // Basic validation
    if (!protocolData || typeof protocolData.gasPriceGwei !== 'number' || !ethPrice) {
         console.error("[API Yield Protocols] Invalid data fetched from core functions.");
         throw new Error("Failed to retrieve valid protocol or pricing data.");
    }

    // Update cache
    const responseData: CacheData = {
        yields: protocolData.yields || [], // Ensure yields is always an array
        gasPriceGwei: protocolData.gasPriceGwei,
        ethPriceUsd: ethPrice
    };
    cache.data = responseData;
    cache.lastUpdated = now;
    console.log("[API Yield Protocols] Cache updated with fresh data");

    return NextResponse.json(responseData);

  } catch (error: any) { // Catch specific error type if possible
    console.error('[API Yield Protocols] Error fetching data:', error);

    // Optionally serve stale cache on error
    if (cache.data) {
        console.warn("[API Yield Protocols] Serving stale cache due to fetch error.");
        return NextResponse.json(cache.data);
    }

    // Return error response
    return NextResponse.json(
        { message: 'Failed to fetch protocol data', error: error.message },
        { status: 500 }
    );
  }
}

// Optional: Add OPTIONS method if dealing with CORS from different origins in some setups
// export async function OPTIONS(req: NextRequest) {
//   return new NextResponse(null, {
//     status: 204,
//     headers: {
//       'Access-Control-Allow-Origin': '*', // Or your specific origin
//       'Access-Control-Allow-Methods': 'GET, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     },
//   });
// }