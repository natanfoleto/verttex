import "./globals.css";

import type { Metadata } from "next";
import * as React from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "../providers/auth-provider";
import { QueryProvider } from "../providers/query-provider";
import { ThemeProvider } from "../providers/theme-provider";

export const metadata: Metadata = {
  title: "Verttex Manager",
  description: "Painel Administrativo do Monorepo Verttex",
  icons: {
    icon: "/icon.svg",
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('verttex-manager-theme');if(t==='light'||(t==='system'&&window.matchMedia('(prefers-color-scheme: light)').matches)){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster position="bottom-right" theme="dark" richColors />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
