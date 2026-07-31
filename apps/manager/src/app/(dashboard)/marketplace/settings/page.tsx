"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import {
  RiGlobalLine,
  RiImageAddLine,
  RiImageLine,
  RiInformationLine,
  RiLoader4Line,
  RiMegaphoneLine,
  RiPaletteLine,
  RiSaveLine,
  RiSearchLine,
  RiServiceLine,
  RiStoreLine,
} from "react-icons/ri";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";

interface MarketplaceSettingsData {
  publicName: string;
  logoFileId?: string | null;
  faviconFileId?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  address: string;
  businessHours: string;
  metaTitle: string;
  metaDescription: string;
  ogImageFileId?: string | null;
  ogImageUrl?: string | null;
  announcementActive: boolean;
  announcementText: string;
  announcementLink: string;
  announcementBgColor: string;
  announcementTextColor: string;
  announcementDismissible: boolean;
  outOfStockBehavior: "show_badge" | "hide_product" | "move_to_end";
  carouselAutoplay: boolean;
  carouselIntervalSeconds: number;
}

const DEFAULT_SETTINGS: MarketplaceSettingsData = {
  publicName: "VERTTEX Marketplace",
  primaryColor: "#0f172a",
  secondaryColor: "#16a34a",
  supportEmail: "",
  supportPhone: "",
  supportWhatsapp: "",
  address: "",
  businessHours: "",
  metaTitle: "",
  metaDescription: "",
  announcementActive: false,
  announcementText: "",
  announcementLink: "",
  announcementBgColor: "#1e293b",
  announcementTextColor: "#ffffff",
  announcementDismissible: true,
  outOfStockBehavior: "show_badge",
  carouselAutoplay: true,
  carouselIntervalSeconds: 5,
};

export default function MarketplaceSettingsPage() {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<MarketplaceSettingsData>(DEFAULT_SETTINGS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Previews locais
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-settings"],
    queryFn: () => apiClient<MarketplaceSettingsData | { data: MarketplaceSettingsData }>("/marketplace/settings"),
  });

  useEffect(() => {
    const res = (data as any)?.data || data;
    if (res && typeof res === "object") {
      setSettings({
        publicName: res.publicName || "VERTTEX Marketplace",
        logoFileId: res.logoFileId || null,
        faviconFileId: res.faviconFileId || null,
        logoUrl: res.logoUrl || null,
        faviconUrl: res.faviconUrl || null,
        primaryColor: res.primaryColor || "#0f172a",
        secondaryColor: res.secondaryColor || "#16a34a",
        supportEmail: res.supportEmail || "",
        supportPhone: res.supportPhone || "",
        supportWhatsapp: res.supportWhatsapp || "",
        address: res.address || "",
        businessHours: res.businessHours || "",
        metaTitle: res.metaTitle || "",
        metaDescription: res.metaDescription || "",
        ogImageFileId: res.ogImageFileId || null,
        ogImageUrl: res.ogImageUrl || null,
        announcementActive: Boolean(res.announcementActive),
        announcementText: res.announcementText || "",
        announcementLink: res.announcementLink || "",
        announcementBgColor: res.announcementBgColor || "#1e293b",
        announcementTextColor: res.announcementTextColor || "#ffffff",
        announcementDismissible: res.announcementDismissible ?? true,
        outOfStockBehavior: ["show_badge", "hide_product", "move_to_end"].includes(res.outOfStockBehavior)
          ? res.outOfStockBehavior
          : "show_badge",
        carouselAutoplay: res.carouselAutoplay ?? true,
        carouselIntervalSeconds: Number(res.carouselIntervalSeconds) || 5,
      });
    }
  }, [data]);

  // Upload genérico para arquivos (Logo, Favicon, OG Image)
  async function uploadFile(file: File, purpose: string): Promise<string | null> {
    setIsUploading(true);
    try {
      let fileId: string | null = null;

      // 1. Tenta upload via URL Pré-Assinada
      try {
        const presignedRes = await apiClient<{
          success: boolean;
          data: { uploadUrl: string; publicUrl: string; fileId: string };
        }>("/files/presigned-url", {
          method: "POST",
          body: {
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            purpose,
          },
        });

        const presigned = presignedRes.data || presignedRes;
        if (presigned?.uploadUrl) {
          const putRes = await fetch(presigned.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (putRes.ok) {
            const finalizedRes = await apiClient<{
              success: boolean;
              data: { id: string; publicUrl: string };
            }>(`/files/${presigned.fileId}/finalize`, { method: "POST" });

            const finalized = finalizedRes.data || finalizedRes;
            fileId = finalized.id || presigned.fileId;
          }
        }
      } catch {
        // Fallback para multipart upload
      }

      // 2. Fallback: Upload Multipart direto via API (/files/upload)
      if (!fileId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", purpose);

        const uploadRes = await apiClient<{
          success: boolean;
          data: { id: string; publicUrl: string };
        }>("/files/upload", {
          method: "POST",
          body: formData,
        });

        const uploadedFile = uploadRes.data || uploadRes;
        fileId = uploadedFile.id;
      }

      return fileId;
    } catch (err: any) {
      toast.error(`Falha no upload do arquivo (${purpose}): ` + (err?.message || "Tente novamente"));
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    const fileId = await uploadFile(file, "store_logo");
    if (fileId) {
      setSettings((prev) => ({ ...prev, logoFileId: fileId }));
      toast.success("Logo enviada e pronta para salvar!");
    }
  }

  async function handleFaviconSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconPreview(URL.createObjectURL(file));
    const fileId = await uploadFile(file, "store_logo");
    if (fileId) {
      setSettings((prev) => ({ ...prev, faviconFileId: fileId }));
      toast.success("Favicon enviado e pronto para salvar!");
    }
  }

  async function handleOgImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOgImagePreview(URL.createObjectURL(file));
    const fileId = await uploadFile(file, "store_logo");
    if (fileId) {
      setSettings((prev) => ({ ...prev, ogImageFileId: fileId }));
      toast.success("Imagem de compartilhamento (OG) enviada e pronta para salvar!");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient("/marketplace/settings", {
        method: "PUT",
        body: settings,
      });
      toast.success("Configurações do Marketplace salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-zinc-800" />
        <div className="h-4 w-96 rounded bg-zinc-800/60" />
        <div className="h-96 w-full rounded-xl bg-zinc-900 border border-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-zinc-100 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Configurações Globais
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Defina a identidade, branding, contatos de suporte, SEO, regras do carrossel e catálogo.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading}
          className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
        >
          {isSubmitting || isUploading ? (
            <RiLoader4Line className="h-4 w-4 animate-spin" />
          ) : (
            <RiSaveLine className="h-4 w-4" />
          )}
          <span>Salvar Alterações</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Navegação por Abas (6 Categorias Claras e Dedicadas) */}
        <Tabs defaultValue="identity" className="w-full space-y-6">
          <TabsList className="bg-zinc-900/90 border border-zinc-800 p-1.5 h-auto flex flex-wrap justify-start gap-1 w-full rounded-xl">
            <TabsTrigger value="identity" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400">
              <RiStoreLine className="h-4 w-4" />
              <span>Identidade & Cores</span>
            </TabsTrigger>
            <TabsTrigger value="carousel" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400">
              <RiImageLine className="h-4 w-4" />
              <span>Carrossel do Site</span>
            </TabsTrigger>
            <TabsTrigger value="announcement" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400">
              <RiMegaphoneLine className="h-4 w-4" />
              <span>Barra de Comunicado</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400">
              <RiServiceLine className="h-4 w-4" />
              <span>Atendimento & Endereço</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400">
              <RiSearchLine className="h-4 w-4" />
              <span>SEO & Metadados</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400">
              <RiGlobalLine className="h-4 w-4" />
              <span>Regras do Catálogo</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Identidade & Cores */}
          <TabsContent value="identity" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Identidade */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <RiStoreLine className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Identidade do Marketplace</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Nome Público da Plataforma *
                    </label>
                    <Input
                      required
                      placeholder="Ex: VERTTEX Marketplace"
                      value={settings.publicName}
                      onChange={(e) => setSettings({ ...settings, publicName: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  {/* Logo */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Logo da Marca</label>
                    <div className="flex items-center gap-3 mt-1">
                      {(logoPreview || settings.logoUrl) && (
                        <div className="size-12 rounded-lg bg-zinc-950 border border-zinc-700 overflow-hidden flex items-center justify-center">
                          <img src={logoPreview || settings.logoUrl!} alt="Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        className="cursor-pointer border-zinc-700 text-zinc-300 gap-1.5"
                      >
                        <RiImageAddLine className="h-4 w-4" />
                        <span>{settings.logoUrl || logoPreview ? "Trocar Logo" : "Escolher Logo"}</span>
                      </Button>
                      {(settings.logoFileId || settings.logoUrl) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLogoPreview(null);
                            setSettings({ ...settings, logoFileId: null, logoUrl: null });
                          }}
                          className="cursor-pointer text-red-400 hover:bg-red-950/40 text-xs"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Favicon */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Favicon (Aba do Navegador)</label>
                    <div className="flex items-center gap-3 mt-1">
                      {(faviconPreview || settings.faviconUrl) && (
                        <div className="size-8 rounded-md bg-zinc-950 border border-zinc-700 overflow-hidden flex items-center justify-center">
                          <img src={faviconPreview || settings.faviconUrl!} alt="Favicon" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      <input ref={faviconInputRef} type="file" accept="image/*" onChange={handleFaviconSelect} className="hidden" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => faviconInputRef.current?.click()}
                        className="cursor-pointer border-zinc-700 text-zinc-300 gap-1.5"
                      >
                        <RiImageAddLine className="h-4 w-4" />
                        <span>{settings.faviconUrl || faviconPreview ? "Trocar Favicon" : "Escolher Favicon"}</span>
                      </Button>
                      {(settings.faviconFileId || settings.faviconUrl) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFaviconPreview(null);
                            setSettings({ ...settings, faviconFileId: null, faviconUrl: null });
                          }}
                          className="cursor-pointer text-red-400 hover:bg-red-950/40 text-xs"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Cores */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <RiPaletteLine className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Cores da Interface</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Cor Primária (Hexadecimal)</label>
                    <div className="flex gap-2 items-center mt-1">
                      <input
                        type="color"
                        value={settings.primaryColor || "#0f172a"}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="size-9 rounded cursor-pointer border border-zinc-700 bg-zinc-800"
                      />
                      <Input
                        value={settings.primaryColor || ""}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        placeholder="#0f172a"
                        className="bg-zinc-800/60 border-zinc-700 text-zinc-100 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Cor Secundária (Destaques/CTA)</label>
                    <div className="flex gap-2 items-center mt-1">
                      <input
                        type="color"
                        value={settings.secondaryColor || "#16a34a"}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="size-9 rounded cursor-pointer border border-zinc-700 bg-zinc-800"
                      />
                      <Input
                        value={settings.secondaryColor || ""}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        placeholder="#16a34a"
                        className="bg-zinc-800/60 border-zinc-700 text-zinc-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba 2: Carrossel do Site (Aba Dedicada) */}
          <TabsContent value="carousel" className="space-y-6 mt-0">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 w-full">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <RiImageLine className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-zinc-100">Regras de Exibição do Carrossel</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="carouselAutoplay"
                    checked={settings.carouselAutoplay}
                    onCheckedChange={(checked) => setSettings({ ...settings, carouselAutoplay: !!checked })}
                    className="cursor-pointer border-zinc-600 data-[state=checked]:bg-emerald-600"
                  />
                  <label htmlFor="carouselAutoplay" className="text-sm text-zinc-300 cursor-pointer font-medium">
                    Transição automática de banners (Autoplay)
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Tempo de exibição de cada banner (segundos)
                  </label>
                  <NativeSelect
                    value={String(settings.carouselIntervalSeconds)}
                    onChange={(e) => setSettings({ ...settings, carouselIntervalSeconds: Number(e.target.value) || 5 })}
                    wrapperClassName="mt-1"
                  >
                    <option value="3">3 segundos</option>
                    <option value="5">5 segundos (Padrão)</option>
                    <option value="7">7 segundos</option>
                    <option value="10">10 segundos</option>
                    <option value="15">15 segundos</option>
                  </NativeSelect>
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Tempo de permanência de cada slide na tela antes de avançar automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba 3: Barra de Comunicado */}
          <TabsContent value="announcement" className="space-y-6 mt-0">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 w-full">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <RiMegaphoneLine className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-zinc-100">Barra de Comunicado / Aviso Global</h2>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="announcementActive"
                  checked={settings.announcementActive}
                  onCheckedChange={(checked) => setSettings({ ...settings, announcementActive: !!checked })}
                  className="cursor-pointer border-zinc-600 data-[state=checked]:bg-emerald-600"
                />
                <label htmlFor="announcementActive" className="text-sm text-zinc-300 cursor-pointer font-medium">
                  Ativar barra de aviso no topo do site
                </label>
              </div>

              {settings.announcementActive && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Texto do Comunicado</label>
                    <Input
                      placeholder="Ex: 🚚 Frete Grátis para compras acima de R$ 300,00!"
                      value={settings.announcementText || ""}
                      onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Link do Comunicado (Opcional)</label>
                      <Input
                        placeholder="Ex: /ofertas"
                        value={settings.announcementLink || ""}
                        onChange={(e) => setSettings({ ...settings, announcementLink: e.target.value })}
                        className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Cor de Fundo da Barra</label>
                      <div className="flex gap-2 items-center mt-1">
                        <input
                          type="color"
                          value={settings.announcementBgColor || "#1e293b"}
                          onChange={(e) => setSettings({ ...settings, announcementBgColor: e.target.value })}
                          className="size-9 rounded cursor-pointer border border-zinc-700 bg-zinc-800"
                        />
                        <Input
                          value={settings.announcementBgColor || "#1e293b"}
                          onChange={(e) => setSettings({ ...settings, announcementBgColor: e.target.value })}
                          className="bg-zinc-800/60 border-zinc-700 text-zinc-100 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba 4: Atendimento & Endereço */}
          <TabsContent value="support" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Contatos */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <RiServiceLine className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Atendimento e Suporte</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">E-mail de Suporte</label>
                    <Input
                      type="email"
                      placeholder="suporte@verttex.com.br"
                      value={settings.supportEmail || ""}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Telefone de Contato</label>
                    <Input
                      placeholder="(11) 4003-8899"
                      value={settings.supportPhone || ""}
                      onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">WhatsApp de Atendimento</label>
                    <Input
                      placeholder="(11) 99887-7665"
                      value={settings.supportWhatsapp || ""}
                      onChange={(e) => setSettings({ ...settings, supportWhatsapp: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Card Endereço e Horário */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <RiInformationLine className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Endereço e Horário Comercial</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Endereço Físico / Sede</label>
                    <Input
                      placeholder="Ex: Av. Principal, 1000 — Centro"
                      value={settings.address || ""}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Horário de Funcionamento</label>
                    <Input
                      placeholder="Ex: Segunda a Sexta, das 08h às 18h"
                      value={settings.businessHours || ""}
                      onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba 5: SEO & Metadados */}
          <TabsContent value="seo" className="space-y-6 mt-0">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <RiSearchLine className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-zinc-100">Otimização para Motores de Busca (SEO)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Título Meta (SEO Title)</label>
                    <Input
                      placeholder="Ex: VERTTEX — Marketplace da Prefeitura & Produtores Locais"
                      value={settings.metaTitle || ""}
                      onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Descrição Meta (SEO Description)</label>
                    <Textarea
                      placeholder="Ex: Compre produtos locais, artesanais e regionais diretamente de produtores da nossa cidade."
                      value={settings.metaDescription || ""}
                      onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1 h-24"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Imagem de Compartilhamento Social (OG Image)</label>
                  <div className="space-y-3 mt-1">
                    {(ogImagePreview || settings.ogImageUrl) && (
                      <div className="h-32 w-full rounded-md bg-zinc-950 border border-zinc-700 overflow-hidden flex items-center justify-center">
                        <img src={ogImagePreview || settings.ogImageUrl!} alt="OG Image" className="max-h-full max-w-full object-cover" />
                      </div>
                    )}
                    <input ref={ogImageInputRef} type="file" accept="image/*" onChange={handleOgImageSelect} className="hidden" />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => ogImageInputRef.current?.click()}
                        className="cursor-pointer border-zinc-700 text-zinc-300 gap-1.5"
                      >
                        <RiImageAddLine className="h-4 w-4" />
                        <span>{settings.ogImageUrl || ogImagePreview ? "Trocar Imagem OG" : "Escolher Imagem OG"}</span>
                      </Button>
                      {(settings.ogImageFileId || settings.ogImageUrl) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOgImagePreview(null);
                            setSettings({ ...settings, ogImageFileId: null, ogImageUrl: null });
                          }}
                          className="cursor-pointer text-red-400 hover:bg-red-950/40 text-xs"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba 6: Regras do Catálogo & Estoque */}
          <TabsContent value="catalog" className="space-y-6 mt-0">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 w-full">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <RiGlobalLine className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-zinc-100">Regras de Exibição no Catálogo</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Comportamento para Produtos Esgotados / Sem Estoque
                </label>
                <NativeSelect
                  value={settings.outOfStockBehavior}
                  onChange={(e) => setSettings({ ...settings, outOfStockBehavior: e.target.value as any })}
                  wrapperClassName="mt-1"
                >
                  <option value="show_badge">Manter no catálogo e exibir badge "Esgotado"</option>
                  <option value="hide_product">Ocultar produto da listagem pública</option>
                  <option value="move_to_end">Mover produtos esgotados para o final do catálogo</option>
                </NativeSelect>
                <p className="text-xs text-zinc-500 mt-1.5">
                  Determina como a API pública e o e-commerce ordenam ou filtram produtos sem saldo em estoque comercial.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
