import type { Metadata } from "next";
// import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PriceMarquee } from "@/components/price-marquee";
// import { ThemeProvider } from "@/components/theme-provider";
import { PrivyProvider } from "@privy-io/react-auth";
import { privyConfig } from "@/lib/privy";
import { Providers } from "./providers";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

// const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inchy.ai - Your AI Crypto Assistant",
  description: "AI-powered crypto insights and market analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
      // className={spaceGrotesk.className}
      >
        {/* <ThemeProvider> */}
        {/* <PrivyProvider appId="cm5qnadbd01ejm51k0qtyolck" config={privyConfig}> */}
        <Providers>
          <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
            <PriceMarquee />
            {children}
          </div>
        </Providers>
        {/* </PrivyProvider> */}
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
