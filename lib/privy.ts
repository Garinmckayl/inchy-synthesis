import type { PrivyClientConfig } from "@privy-io/react-auth"

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

