'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  RiDeleteBinLine,
  RiGlobalLine,
  RiImageAddLine,
  RiImageLine,
  RiInformationLine,
  RiLoader4Line,
  RiMegaphoneLine,
  RiSaveLine,
  RiSearchLine,
  RiServiceLine,
  RiStoreLine,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api-client'

interface MarketplaceSettingsData {
  publicName: string
  logoFileId?: string | null
  faviconFileId?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  supportEmail: string
  supportPhone: string
  supportWhatsapp: string
  address: string
  businessHours: string
  metaTitle: string
  metaDescription: string
  ogImageFileId?: string | null
  ogImageUrl?: string | null
  announcementActive: boolean
  announcementText: string
  announcementLink: string
  announcementDismissible: boolean
  outOfStockBehavior: 'show_badge' | 'hide_product' | 'move_to_end'
  carouselAutoplay: boolean
  carouselIntervalSeconds: number
  carouselTitlePosition: 'TOP' | 'CENTER' | 'BOTTOM' | 'NONE'
  carouselTitleHAlign: 'LEFT' | 'CENTER' | 'RIGHT'
}

const DEFAULT_SETTINGS: MarketplaceSettingsData = {
  publicName: 'VERTTEX Marketplace',
  supportEmail: '',
  supportPhone: '',
  supportWhatsapp: '',
  address: '',
  businessHours: '',
  metaTitle: '',
  metaDescription: '',
  announcementActive: false,
  announcementText: '',
  announcementLink: '',
  announcementDismissible: true,
  outOfStockBehavior: 'show_badge',
  carouselAutoplay: true,
  carouselIntervalSeconds: 5,
  carouselTitlePosition: 'CENTER',
  carouselTitleHAlign: 'LEFT',
}

export default function MarketplaceSettingsPage() {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const ogImageInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] =
    useState<MarketplaceSettingsData>(DEFAULT_SETTINGS)
  const [savedSettings, setSavedSettings] =
    useState<MarketplaceSettingsData>(DEFAULT_SETTINGS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Desabilita o botão de salvar caso o formulário esteja pristine (sem alterações)
  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  // Previews locais
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace-settings'],
    queryFn: () =>
      apiClient<MarketplaceSettingsData | { data: MarketplaceSettingsData }>(
        '/marketplace/settings',
      ),
  })

  useEffect(() => {
    const res = (data as any)?.data || data
    if (res && typeof res === 'object') {
      const loaded: MarketplaceSettingsData = {
        publicName: res.publicName || 'VERTTEX Marketplace',
        logoFileId: res.logoFileId || null,
        faviconFileId: res.faviconFileId || null,
        logoUrl: res.logoUrl || null,
        faviconUrl: res.faviconUrl || null,
        supportEmail: res.supportEmail || '',
        supportPhone: res.supportPhone || '',
        supportWhatsapp: res.supportWhatsapp || '',
        address: res.address || '',
        businessHours: res.businessHours || '',
        metaTitle: res.metaTitle || '',
        metaDescription: res.metaDescription || '',
        ogImageFileId: res.ogImageFileId || null,
        ogImageUrl: res.ogImageUrl || null,
        announcementActive: Boolean(res.announcementActive),
        announcementText: res.announcementText || '',
        announcementLink: res.announcementLink || '',
        announcementDismissible: res.announcementDismissible ?? true,
        outOfStockBehavior: [
          'show_badge',
          'hide_product',
          'move_to_end',
        ].includes(res.outOfStockBehavior)
          ? res.outOfStockBehavior
          : 'show_badge',
        carouselAutoplay: res.carouselAutoplay ?? true,
        carouselIntervalSeconds: Number(res.carouselIntervalSeconds) || 5,
        carouselTitlePosition: res.carouselTitlePosition || 'CENTER',
        carouselTitleHAlign: res.carouselTitleHAlign || 'LEFT',
      }
      setSettings(loaded)
      setSavedSettings(loaded)
    }
  }, [data])

  // Upload genérico para arquivos (Logo, Favicon, OG Image)
  async function uploadFile(
    file: File,
    purpose: string,
  ): Promise<string | null> {
    setIsUploading(true)
    try {
      let fileId: string | null = null

      // 1. Tenta upload via URL Pré-Assinada
      try {
        const presignedRes = await apiClient<{
          success: boolean
          data: { uploadUrl: string; publicUrl: string; fileId: string }
        }>('/files/presigned-url', {
          method: 'POST',
          body: {
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            purpose,
          },
        })

        const presigned = presignedRes.data || presignedRes
        if (presigned?.uploadUrl) {
          const putRes = await fetch(presigned.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          })

          if (putRes.ok) {
            const finalizedRes = await apiClient<{
              success: boolean
              data: { id: string; publicUrl: string }
            }>(`/files/${presigned.fileId}/finalize`, { method: 'POST' })

            const finalized = finalizedRes.data || finalizedRes
            fileId = finalized.id || presigned.fileId
          }
        }
      } catch {
        // Fallback para multipart upload
      }

      // 2. Fallback: Upload Multipart direto via API (/files/upload)
      if (!fileId) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('purpose', purpose)

        const uploadRes = await apiClient<{
          success: boolean
          data: { id: string; publicUrl: string }
        }>('/files/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadedFile = uploadRes.data || uploadRes
        fileId = uploadedFile.id
      }

      return fileId
    } catch (err: any) {
      toast.error(
        `Falha no upload do arquivo (${purpose}): ` +
          (err?.message || 'Tente novamente'),
      )
      return null
    } finally {
      setIsUploading(false)
    }
  }

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoPreview(URL.createObjectURL(file))
    const fileId = await uploadFile(file, 'marketplace_logo')
    if (fileId) {
      setSettings((prev) => ({ ...prev, logoFileId: fileId }))
      toast.success('Logo enviada e pronta para salvar!')
    }
  }

  async function handleFaviconSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFaviconPreview(URL.createObjectURL(file))
    const fileId = await uploadFile(file, 'marketplace_favicon')
    if (fileId) {
      setSettings((prev) => ({ ...prev, faviconFileId: fileId }))
      toast.success('Favicon enviado e pronto para salvar!')
    }
  }

  async function handleOgImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setOgImagePreview(URL.createObjectURL(file))
    const fileId = await uploadFile(file, 'marketplace_og_image')
    if (fileId) {
      setSettings((prev) => ({ ...prev, ogImageFileId: fileId }))
      toast.success(
        'Imagem de compartilhamento (OG) enviada e pronta para salvar!',
      )
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { logoUrl, faviconUrl, ogImageUrl, ...payload } = settings
      await apiClient('/marketplace/settings', {
        method: 'PUT',
        body: payload,
      })
      setSavedSettings(settings)
      toast.success('Configurações do Marketplace salvas com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-zinc-800" />
        <div className="h-4 w-96 rounded bg-zinc-800/60" />
        <div className="h-96 w-full rounded-xl bg-zinc-900 border border-zinc-800" />
      </div>
    )
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
            Defina a identidade, branding, contatos de suporte, SEO, regras do
            carrossel e catálogo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isDirty || isSubmitting || isUploading}
            className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isUploading ? (
              <RiLoader4Line className="h-4 w-4 animate-spin" />
            ) : (
              <RiSaveLine className="h-4 w-4" />
            )}
            <span>Salvar Alterações</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Navegação por Abas */}
        <Tabs defaultValue="identity" className="w-full space-y-6">
          <TabsList className="bg-zinc-900/90 border border-zinc-800 p-1.5 h-auto flex flex-wrap justify-start gap-1 w-full rounded-xl">
            <TabsTrigger
              value="identity"
              className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400"
            >
              <RiStoreLine className="h-4 w-4" />
              <span>Identidade Visual</span>
            </TabsTrigger>
            <TabsTrigger
              value="carousel"
              className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400"
            >
              <RiImageLine className="h-4 w-4" />
              <span>Carrossel do Site</span>
            </TabsTrigger>
            <TabsTrigger
              value="announcement"
              className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400"
            >
              <RiMegaphoneLine className="h-4 w-4" />
              <span>Barra de Comunicado</span>
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400"
            >
              <RiServiceLine className="h-4 w-4" />
              <span>Atendimento & Endereço</span>
            </TabsTrigger>
            <TabsTrigger
              value="seo"
              className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400"
            >
              <RiSearchLine className="h-4 w-4" />
              <span>SEO & Metadados</span>
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="gap-2 px-4 py-2 text-xs font-semibold data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400"
            >
              <RiGlobalLine className="h-4 w-4" />
              <span>Regras do Catálogo</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Identidade Visual */}
          <TabsContent value="identity" className="space-y-6 mt-0 w-full">
            {/* Card Identidade */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 w-full">
              <div className="flex items-center gap-2">
                <RiStoreLine className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-zinc-100">
                  Identidade do Marketplace
                </h2>
              </div>

              {/* Linha 1: Nome Público */}
              <div>
                <label className="text-xs font-semibold text-zinc-300">
                  Nome Público da Plataforma *
                </label>
                <Input
                  required
                  placeholder="Ex: VERTTEX Marketplace"
                  value={settings.publicName}
                  onChange={(e) =>
                    setSettings({ ...settings, publicName: e.target.value })
                  }
                  className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                />
              </div>

              {/* Linha 2: Favicon (esquerda) + Logo (direita) */}
              <div className="flex flex-wrap gap-6 items-start">
                {/* Favicon — quadrado, h-24 w-24 */}
                <div className="w-24">
                  <label className="text-xs font-semibold text-zinc-300">
                    Favicon
                  </label>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => faviconInputRef.current?.click()}
                    className="mt-1 w-24 h-24 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/60 flex items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-500 hover:bg-zinc-800 transition-colors group p-0"
                  >
                    {faviconPreview || settings.faviconUrl ? (
                      <img
                        src={faviconPreview || settings.faviconUrl!}
                        alt="Favicon"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        <RiImageAddLine className="h-5 w-5" />
                        <span className="text-[10px] font-medium">Favicon</span>
                      </div>
                    )}
                  </Button>
                  {(settings.faviconFileId || settings.faviconUrl) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFaviconPreview(null)
                        setSettings({
                          ...settings,
                          faviconFileId: null,
                          faviconUrl: null,
                        })
                      }}
                      className="cursor-pointer border-red-800/70 text-red-400 hover:bg-red-950/40 gap-1.5 w-full mt-2"
                    >
                      <RiDeleteBinLine className="h-4 w-4 shrink-0" />
                      <span>Remover</span>
                    </Button>
                  )}
                </div>

                {/* Logo — landscape */}
                <div className="w-64">
                  <label className="text-xs font-semibold text-zinc-300">
                    Logo da Marca
                  </label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => logoInputRef.current?.click()}
                    className="mt-1 w-full h-24 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/60 flex items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-500 hover:bg-zinc-800 transition-colors group p-0"
                  >
                    {logoPreview || settings.logoUrl ? (
                      <img
                        src={logoPreview || settings.logoUrl!}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain px-4 py-2"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        <RiImageAddLine className="h-5 w-5 shrink-0" />
                        <span className="text-[11px] font-medium">
                          Escolher logo
                        </span>
                      </div>
                    )}
                  </Button>
                  {(settings.logoFileId || settings.logoUrl) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogoPreview(null)
                        setSettings({
                          ...settings,
                          logoFileId: null,
                          logoUrl: null,
                        })
                      }}
                      className="cursor-pointer border-red-800/70 text-red-400 hover:bg-red-950/40 gap-1.5 w-full mt-2"
                    >
                      <RiDeleteBinLine className="h-4 w-4 shrink-0" />
                      <span>Remover</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba 2: Carrossel do Site */}
          <TabsContent value="carousel" className="space-y-6 mt-0">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 w-full">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <RiImageLine className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-zinc-100">
                  Regras de Exibição do Carrossel
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="carouselAutoplay"
                    checked={settings.carouselAutoplay}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, carouselAutoplay: !!checked })
                    }
                    className="cursor-pointer border-zinc-600 data-[state=checked]:bg-emerald-600"
                  />
                  <label
                    htmlFor="carouselAutoplay"
                    className="text-sm text-zinc-300 cursor-pointer font-medium"
                  >
                    Transição automática de banners (Autoplay)
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Tempo de exibição de cada banner (segundos)
                  </label>
                  <NativeSelect
                    value={String(settings.carouselIntervalSeconds)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        carouselIntervalSeconds: Number(e.target.value) || 5,
                      })
                    }
                    wrapperClassName="mt-1"
                  >
                    <option value="3">3 segundos</option>
                    <option value="5">5 segundos (Padrão)</option>
                    <option value="7">7 segundos</option>
                    <option value="10">10 segundos</option>
                    <option value="15">15 segundos</option>
                  </NativeSelect>
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Tempo de permanência de cada slide na tela antes de avançar
                    automaticamente.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Posição dos Títulos & Subtítulos nos Banners
                  </label>
                  <NativeSelect
                    value={settings.carouselTitlePosition || 'CENTER'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        carouselTitlePosition: e.target.value as any,
                      })
                    }
                    wrapperClassName="mt-1"
                  >
                    <option value="TOP">Exibir no topo</option>
                    <option value="CENTER">Exibir no centro (Padrão)</option>
                    <option value="BOTTOM">Exibir embaixo</option>
                    <option value="NONE">
                      Não exibir (Ocultar títulos e subtítulos)
                    </option>
                  </NativeSelect>
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Define em qual posição os textos dos banners serão alinhados
                    verticalmente dentro dos slides.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Alinhamento Horizontal dos Títulos & Subtítulos
                  </label>
                  <NativeSelect
                    value={settings.carouselTitleHAlign || 'LEFT'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        carouselTitleHAlign: e.target.value as any,
                      })
                    }
                    wrapperClassName="mt-1"
                  >
                    <option value="LEFT">Alinhar à esquerda (Padrão)</option>
                    <option value="CENTER">Centralizar</option>
                    <option value="RIGHT">Alinhar à direita</option>
                  </NativeSelect>
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Define o alinhamento horizontal dos títulos dentro dos
                    slides do carrossel.
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
                <h2 className="text-base font-semibold text-zinc-100">
                  Barra de Comunicado / Aviso Global
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="announcementActive"
                  checked={settings.announcementActive}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, announcementActive: !!checked })
                  }
                  className="cursor-pointer border-zinc-600 data-[state=checked]:bg-emerald-600"
                />
                <label
                  htmlFor="announcementActive"
                  className="text-sm text-zinc-300 cursor-pointer font-medium"
                >
                  Ativar barra de aviso no topo do site
                </label>
              </div>

              {settings.announcementActive && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Texto do Comunicado
                    </label>
                    <Input
                      placeholder="Ex: 🚚 Frete Grátis para compras acima de R$ 300,00!"
                      value={settings.announcementText || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          announcementText: e.target.value,
                        })
                      }
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Link do Comunicado (Opcional)
                    </label>
                    <Input
                      placeholder="Ex: /ofertas"
                      value={settings.announcementLink || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          announcementLink: e.target.value,
                        })
                      }
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
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
                  <h2 className="text-base font-semibold text-zinc-100">
                    Atendimento e Suporte
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      E-mail de Suporte
                    </label>
                    <Input
                      type="email"
                      placeholder="suporte@verttex.com.br"
                      value={settings.supportEmail || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          supportEmail: e.target.value,
                        })
                      }
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Telefone de Contato
                    </label>
                    <Input
                      placeholder="(11) 4003-8899"
                      value={settings.supportPhone || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          supportPhone: e.target.value,
                        })
                      }
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      WhatsApp de Atendimento
                    </label>
                    <Input
                      placeholder="(11) 99887-7665"
                      value={settings.supportWhatsapp || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          supportWhatsapp: e.target.value,
                        })
                      }
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Card Endereço e Horário */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <RiInformationLine className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold text-zinc-100">
                    Endereço e Horário Comercial
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Endereço Físico / Sede
                    </label>
                    <Input
                      placeholder="Ex: Av. Principal, 1000 — Centro"
                      value={settings.address || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, address: e.target.value })
                      }
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Horário de Funcionamento
                    </label>
                    <Input
                      placeholder="Ex: Segunda a Sexta, das 08h às 18h"
                      value={settings.businessHours || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          businessHours: e.target.value,
                        })
                      }
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
                <h2 className="text-base font-semibold text-zinc-100">
                  Otimização para Motores de Busca (SEO)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Título Meta (SEO Title)
                    </label>
                    <Input
                      placeholder="Ex: VERTTEX — Marketplace da Prefeitura & Produtores Locais"
                      value={settings.metaTitle || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, metaTitle: e.target.value })
                      }
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">
                      Descrição Meta (SEO Description)
                    </label>
                    <Textarea
                      placeholder="Ex: Compre produtos locais, artesanais e regionais diretamente de produtores da nossa cidade."
                      value={settings.metaDescription || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          metaDescription: e.target.value,
                        })
                      }
                      className="bg-zinc-800/60 border-zinc-700 text-zinc-100 mt-1 h-24"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Imagem de Compartilhamento Social (OG Image)
                  </label>
                  <div className="space-y-3 mt-1">
                    {(ogImagePreview || settings.ogImageUrl) && (
                      <div className="h-32 w-full rounded-md bg-zinc-950 border border-zinc-700 overflow-hidden flex items-center justify-center">
                        <img
                          src={ogImagePreview || settings.ogImageUrl!}
                          alt="OG Image"
                          className="max-h-full max-w-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      ref={ogImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleOgImageSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => ogImageInputRef.current?.click()}
                        className="cursor-pointer border-zinc-700 text-zinc-300 gap-1.5"
                      >
                        <RiImageAddLine className="h-4 w-4" />
                        <span>
                          {settings.ogImageUrl || ogImagePreview
                            ? 'Trocar Imagem OG'
                            : 'Escolher Imagem OG'}
                        </span>
                      </Button>
                      {(settings.ogImageFileId || settings.ogImageUrl) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOgImagePreview(null)
                            setSettings({
                              ...settings,
                              ogImageFileId: null,
                              ogImageUrl: null,
                            })
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
                <h2 className="text-base font-semibold text-zinc-100">
                  Regras de Exibição no Catálogo
                </h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Comportamento para Produtos Esgotados / Sem Estoque
                </label>
                <NativeSelect
                  value={settings.outOfStockBehavior}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      outOfStockBehavior: e.target.value as any,
                    })
                  }
                  wrapperClassName="mt-1"
                >
                  <option value="show_badge">
                    Manter no catálogo e exibir badge "Esgotado"
                  </option>
                  <option value="hide_product">
                    Ocultar produto da listagem pública
                  </option>
                  <option value="move_to_end">
                    Mover produtos esgotados para o final do catálogo
                  </option>
                </NativeSelect>
                <p className="text-xs text-zinc-500 mt-1.5">
                  Determina como a API pública e o e-commerce ordenam ou filtram
                  produtos sem saldo em estoque comercial.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
