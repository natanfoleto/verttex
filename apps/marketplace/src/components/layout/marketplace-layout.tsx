"use client";

import { useQuery } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

import { MarketplaceFooter } from "./marketplace-footer";
import { MarketplaceHeader } from "./marketplace-header";
import { apiClient } from "../../lib/api-client";

interface MarketplaceLayoutProps {
  children: ReactNode;
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-load marketplace settings globally for header & branding
  useQuery<any>({
    queryKey: ["public-marketplace-settings"],
    queryFn: async () => {
      const res = await apiClient<any>("/public/marketplace/settings");
      return res?.data || res;
    },
  });

  // Pre-load public categories globally for header mega-dropdown
  useQuery<any[]>({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const res = await apiClient<any[]>("/public/catalog/categories");
      return res;
    },
  });

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <MarketplaceHeader />
      <main className="w-full flex-1">{children}</main>
      <MarketplaceFooter />
    </div>
  );
}
