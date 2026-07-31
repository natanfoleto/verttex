import "./globals.css";

import type { Metadata } from "next";
import * as React from "react";
import { Toaster } from "sonner";

import { MarketplaceLayout } from "../components/layout/marketplace-layout";
import { MarketplaceThemeProvider } from "../components/layout/marketplace-theme-provider";
import { CustomerAuthProvider } from "../providers/customer-auth-provider";
import { QueryProvider } from "../providers/query-provider";
import { ThemeProvider } from "../providers/theme-provider";

export const metadata: Metadata = {
  title: "Verttex — Mercado Regional & Produtos Artesanais",
  description:
    "Conectamos você aos melhores produtores artesanais da nossa região.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <MarketplaceThemeProvider>
              <CustomerAuthProvider>
                <MarketplaceLayout>{children}</MarketplaceLayout>
              </CustomerAuthProvider>
              <Toaster position="bottom-right" richColors />
            </MarketplaceThemeProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
