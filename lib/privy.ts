// lib/privy.ts
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { PrivyClient } from "@privy-io/server-auth";
import { cookies } from "next/headers";

// --- Your Configuration ---
export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "wallet"],
  appearance: {
    theme: "dark",
    accentColor: "#676FFF",
  },
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
  },
};

// --- Initialize Privy Client ---
// Hardcoding temporarily to debug
export const privyClient = new PrivyClient(
  "cm5qnadbd01ejm51k0qtyolck",
  "2QGDENiW3o4XwdsARYwuvqNM9Tn2hxfPB5iyMy9WcGnVNphDEx59ntLjUSqzzZHRkUtChNi6unchxQZ9nUmRZMhE"
);

// --- Define Returned User Structure ---
export interface AuthenticatedUser {
  id: string; // Privy User ID (DID)
  name: string | null;
  email: string | null;
  image: string | null;
  linkedAccounts: Array<{
    type: string;
    address?: string;
  }>;
}

// --- Get Privy User ---
export async function getPrivyUser(token?: string): Promise<AuthenticatedUser | null> {
  try {
    // Get token from parameter or cookie
    let authToken = token;
    if (!authToken) {
      const cookieStore = cookies();
      authToken = cookieStore.get("privy-token")?.value;
    }

    if (!authToken) {
      console.warn("No auth token provided");
      return null;
    }

    // Log token for debugging
    console.log('Attempting to verify token:', authToken.substring(0, 10) + '...');

    // Verify token
    const verifiedClaims = await privyClient.verifyAuthToken(authToken);
    console.log('Token verified, user ID:', verifiedClaims.userId);
    
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