"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId="cm5qnadbd01ejm51k0qtyolck"
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
        },
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </PrivyProvider>
  );
}
