import type { PrivyClientConfig } from "@privy-io/react-auth"
import { PrivyClient } from "@privy-io/server-auth";
import { cookies } from "next/headers";

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "wallet"],
  appearance: {
    theme: "dark",
    accentColor: "#f97316", // orange-500
    showWalletLoginFirst: true,
  },
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
  },
}

export const privyClient = new PrivyClient(
  "cm5qnadbd01ejm51k0qtyolck",
  "2QRisPgWvitTQgVe195fNTdvibYyMbNsetFXsmpYznoghwA1HegqDBR1ectVV3HVHgyjnYLDnswx1u6EYvWrvdyt",
);

export async function getPrivyUser() {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get("privy-token")?.value;
    
    if (!authToken) {
      return null;
    }

    const verifiedUser = await privyClient.verifyAuthToken(authToken);
    
    if (!verifiedUser) {
      return null;
    }

    // Extract user data safely
    const userData = {
      id: verifiedUser.userId,
      name: null as string | null,
      email: null as string | null,
      image: null as string | null,
    };

    // Safely access claims if they exist
    if (typeof verifiedUser.claims === 'object' && verifiedUser.claims) {
      const claims = verifiedUser.claims as Record<string, unknown>;
      userData.name = (claims.name as string) || null;
      userData.email = (claims.email as string) || null;
      userData.image = (claims.picture as string) || null;
    }

    return userData;
  } catch (error) {
    console.error("Error getting Privy user:", error);
    return null;
  }
}
