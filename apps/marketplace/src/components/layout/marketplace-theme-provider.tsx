"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "../../lib/api-client";

export interface PublicMarketplaceSettings {
  publicName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  supportWhatsapp?: string | null;
  address?: string | null;
  businessHours?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  announcementActive?: boolean;
  announcementText?: string | null;
  announcementLink?: string | null;
  announcementDismissible?: boolean;
  outOfStockBehavior?: string;
  carouselAutoplay?: boolean;
  carouselIntervalSeconds?: number;
}

export function MarketplaceThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settingsRes } = useQuery<PublicMarketplaceSettings>({
    queryKey: ["public-marketplace-settings"],
    queryFn: async () => {
      const res = await apiClient<{ data: PublicMarketplaceSettings }>("/public/marketplace/settings");
      return (res as any)?.data ?? res;
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const s = settingsRes || {};

    // Favicon Dinâmico
    if (s.faviconUrl) {
      let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!iconLink) {
        iconLink = document.createElement("link");
        iconLink.rel = "icon";
        document.getElementsByTagName("head")[0]?.appendChild(iconLink);
      }
      iconLink.href = s.faviconUrl;
    }
  }, [settingsRes]);

  return <>{children}</>;
}
