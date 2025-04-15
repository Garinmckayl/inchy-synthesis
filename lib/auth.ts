// lib/privy.ts
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { PrivyClient, type User as PrivyUser } from "@privy-io/server-auth"; // Import User type
import { cookies } from "next/headers";

// --- Your Configuration ---
export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "wallet"],
  appearance: { /* ... */ },
  embeddedWallets: { /* ... */ },
};

// --- Initialize Client (Use ENV Vars!) ---
const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  console.warn("Privy App ID or Secret missing from environment variables.");
  // throw new Error("Privy environment variables not set."); // Consider throwing in prod
}

// Ensure client is only initialized if keys exist
export const privyClient = new PrivyClient(
    "cm5qnadbd01ejm51k0qtyolck",
    "2QRisPgWvitTQgVe195fNTdvibYyMbNsetFXsmpYznoghwA1HegqDBR1ectVV3HVHgyjnYLDnswx1u6EYvWrvdyt",
    );

// --- Define Returned User Structure ---
export interface AuthenticatedUser {
  id: string; // Privy User ID (DID)
  name: string | null;
  email: string | null;
  image: string | null;
  linkedAccounts: Readonly<PrivyUser['linkedAccounts']>; // Add linked accounts
}

// --- Your getPrivyUser function (modified slightly) ---
export async function getPrivyUser(token?: string): Promise<AuthenticatedUser | null> {
  if (!privyClient) {
    console.error("Privy client not initialized due to missing credentials.");
    return null;
  }

  try {
    // Get token from parameter or cookie
    let authToken = token;
    if (!authToken) {
      const cookieStore = cookies();
      authToken = cookieStore.get("privy-token")?.value;
    }

    if (!authToken) {
      console.warn("No auth token found");
      return null;
    }

    // Verify token
    const verifiedClaims = await privyClient.verifyAuthToken(authToken);
    
    // Get user data
    const user = await privyClient.getUser(verifiedClaims.userId);
    if (!user) {
      console.warn(`Privy user not found for ID: ${verifiedClaims.userId}`);
      return null;
    }

    // Return user data
    return {
      id: user.id,
      name: user.google?.name || user.github?.username || user.discord?.username || user.twitter?.username || null,
      email: user.email?.address || user.google?.email || null,
      image: user.google?.profilePictureUrl || user.github?.avatarUrl || user.discord?.avatarUrl || user.twitter?.profilePictureUrl || null,
      linkedAccounts: user.linkedAccounts || [],
    };

  } catch (error) {
    console.error("Error getting Privy user:", error);
    return null;
  }
}

// Helper to get the primary wallet address
export function getPrimaryWalletAddress(user: AuthenticatedUser | null): string | null {
    if (!user?.linkedAccounts) return null;
    const walletAccount = user.linkedAccounts.find(acc => acc.type === 'wallet');
    return walletAccount?.address || null;
}