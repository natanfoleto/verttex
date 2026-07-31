"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiClient } from "../../lib/api-client";

export interface PublicMarketplaceSettings {
  publicName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  siteBgColor?: string;
  primaryButtonBgColor?: string;
  primaryButtonTextColor?: string;
  secondaryButtonBgColor?: string;
  secondaryButtonTextColor?: string;
  primaryTextColor?: string;
  secondaryTextColor?: string;
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
  announcementBgColor?: string;
  announcementTextColor?: string;
  announcementDismissible?: boolean;
  outOfStockBehavior?: string;
  carouselAutoplay?: boolean;
  carouselIntervalSeconds?: number;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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
    const root = document.documentElement;

    // Injeção dinâmica de variáveis CSS no :root do documento
    root.style.setProperty("--color-header-bg", s.headerBgColor || "#15803d");
    root.style.setProperty("--color-header-text", s.headerTextColor || "#ffffff");
    root.style.setProperty("--color-site-bg", s.siteBgColor || "#f5f5f4");
    root.style.setProperty("--color-btn-primary-bg", s.primaryButtonBgColor || "#16a34a");
    root.style.setProperty("--color-btn-primary-text", s.primaryButtonTextColor || "#ffffff");
    root.style.setProperty("--color-btn-secondary-bg", s.secondaryButtonBgColor || "#e7e5e4");
    root.style.setProperty("--color-btn-secondary-text", s.secondaryButtonTextColor || "#1c1917");
    root.style.setProperty("--color-text-primary", s.primaryTextColor || "#1c1917");
    root.style.setProperty("--color-text-secondary", s.secondaryTextColor || "#78716c");

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
