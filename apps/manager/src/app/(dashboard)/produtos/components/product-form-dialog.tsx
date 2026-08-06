'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  RiAddLine,
  RiCalendarEventLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBin6Line,
  RiImageAddLine,
  RiInformationLine,
  RiPriceTag3Line,
  RiStackLine,
  RiStarFill,
  RiStarLine,
  RiTruckLine,
  RiUpload2Line,
} from 'react-icons/ri'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { PriceInput } from '@/components/ui/price-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useErrorDialog } from '@/providers/error-dialog-provider'

import { apiClient, ApiError } from '../../../../lib/api-client'
import {
  brandQueryKeys,
  categoryQueryKeys,
  storeQueryKeys,
} from '../../../../lib/query-keys'
import { sanitizeSlug } from '../../../../lib/slug'

export interface Store {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
}

export interface Brand {
  id: string
  name: string
}

export interface ProductMediaItem {
  fileId: string
  previewUrl: string
  originalName: string
  isMain: boolean
}

export interface ProductOptionItem {
  name: string
  values: string[]
  valueInput?: string
}

export interface ProductVariationItem {
  sku: string
  barcode?: string
  price: number | string
  promotionalPrice?: number | string
  costPrice?: number | string
  status: 'active' | 'inactive'
  optionValues: Record<string, string>
}

export interface ProductToEdit {
  id: string
  storeId: string
  categoryId: string
  brandId?: string | null
  store?: { id: string; name: string }
  category?: { id: string; name: string }
  brand?: { id: string; name: string } | null
  name: string
  slug: string
  shortDescription?: string | null
  fullDescription?: string | null
  type: 'simple' | 'variable'
  status: 'draft' | 'active' | 'inactive' | 'archived'
  isPublished: boolean
  isFeatured: boolean
  weight?: number | null
  width?: number | null
  height?: number | null
  length?: number | null
  metaTitle?: string | null
  metaDescription?: string | null
  hasBatchControl?: boolean
  hasExpirationControl?: boolean
  isExpirationRequired?: boolean
  defaultShelfLifeDays?: number | null
  minReceivingShelfLifeDays?: number | null
  minDeliveryShelfLifeDays?: number | null
  warningShelfLifeDays?: number | null
  variations?: Array<{
    id: string
    sku: string
    barcode?: string | null
    price: number | string
    promotionalPrice?: number | string | null
    costPrice?: number | string | null
    isDefault: boolean
    status: string
    values?: Array<{
      optionValue?: {
        value: string
        option?: { name: string }
      }
    }>
  }>
  options?: Array<{
    id: string
    name: string
    values?: Array<{ id: string; value: string }>
  }>
  medias?: Array<{
    id: string
    fileId: string
    isMain: boolean
    file: {
      id: string
      objectKey: string
      originalName: string
    }
  }>
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productToEdit?: ProductToEdit | null
  defaultStoreId?: string
}

export function ProductFormDialog({
  open,
  onOpenChange,
  productToEdit,
  defaultStoreId,
}: ProductFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(productToEdit)
  const [activeTab, setActiveTab] = useState<string>('geral')

  // Form Field States
  const [storeId, setStoreId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugUserModified, setIsSlugUserModified] = useState(false)
  const [shortDescription, setShortDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [type, setType] = useState<'simple' | 'variable'>('simple')
  const [status, setStatus] = useState<
    'draft' | 'active' | 'inactive' | 'archived'
  >('draft')
  const [isPublished, setIsPublished] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)

  // Pricing & SKU
  const [price, setPrice] = useState<number>(0)
  const [promotionalPrice, setPromotionalPrice] = useState<number>(0)
  const [costPrice, setCostPrice] = useState<number>(0)
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')

  // Dimensions & SEO
  const [weight, setWeight] = useState<string>('')
  const [width, setWidth] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [length, setLength] = useState<string>('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Batch & Expiration Control
  const [hasBatchControl, setHasBatchControl] = useState(false)
  const [hasExpirationControl, setHasExpirationControl] = useState(false)
  const [isExpirationRequired, setIsExpirationRequired] = useState(false)
  const [defaultShelfLifeDays, setDefaultShelfLifeDays] = useState('')
  const [minReceivingShelfLifeDays, setMinReceivingShelfLifeDays] = useState('')
  const [minDeliveryShelfLifeDays, setMinDeliveryShelfLifeDays] = useState('')
  const [warningShelfLifeDays, setWarningShelfLifeDays] = useState('')

  // Options & Variations
  const [options, setOptions] = useState<ProductOptionItem[]>([])
  const [newOptionName, setNewOptionName] = useState('')
  const [variations, setVariations] = useState<ProductVariationItem[]>([])

  // Media Management
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)

  // Error Dialog
  const { showError } = useErrorDialog()

  // Queries for Dropdowns
  const { data: storesRes } = useQuery({
    queryKey: storeQueryKeys.dropdown(),
    queryFn: async () => {
      const res = await apiClient<{ data?: Store[] } | Store[]>('/stores')
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
    enabled: open,
    staleTime: 0, // Always fetch fresh so newly created stores appear immediately
  })

  const { data: categoriesRes } = useQuery({
    queryKey: categoryQueryKeys.dropdown(),
    queryFn: async () => {
      const res = await apiClient<{ data?: Category[] } | Category[]>(
        '/categories',
      )
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
    enabled: open,
    staleTime: 0, // Always fetch fresh so newly created categories appear immediately
  })

  const { data: brandsRes } = useQuery({
    queryKey: brandQueryKeys.dropdown(),
    queryFn: async () => {
      const res = await apiClient<{ data?: Brand[] } | Brand[]>('/brands')
      return Array.isArray(res) ? res : (res?.data ?? [])
    },
    enabled: open,
    staleTime: 0, // Always fetch fresh so newly created brands appear immediately
  })

  const storesList: Store[] = useMemo(() => storesRes ?? [], [storesRes])
  const categoriesList: Category[] = useMemo(
    () => categoriesRes ?? [],
    [categoriesRes],
  )
  const brandsList: Brand[] = useMemo(() => brandsRes ?? [], [brandsRes])

  const [initialSnapshot, setInitialSnapshot] = useState<string>('')

  // Initialize or Reset Form
  useEffect(() => {
    if (!open) return

    setActiveTab('geral')
    if (productToEdit) {
      setStoreId(productToEdit.storeId || '')
      setCategoryId(productToEdit.categoryId || '')
      setBrandId(productToEdit.brandId || '')
      setName(productToEdit.name || '')
      setSlug(productToEdit.slug || '')
      setIsSlugUserModified(true)
      setShortDescription(productToEdit.shortDescription || '')
      setFullDescription(productToEdit.fullDescription || '')
      setType(productToEdit.type || 'simple')
      setStatus(productToEdit.status || 'draft')
      setIsPublished(Boolean(productToEdit.isPublished))
      setIsFeatured(Boolean(productToEdit.isFeatured))

      setWeight(productToEdit.weight ? String(productToEdit.weight) : '')
      setWidth(productToEdit.width ? String(productToEdit.width) : '')
      setHeight(productToEdit.height ? String(productToEdit.height) : '')
      setLength(productToEdit.length ? String(productToEdit.length) : '')
      setMetaTitle(productToEdit.metaTitle || '')
      setMetaDescription(productToEdit.metaDescription || '')

      setHasBatchControl(Boolean(productToEdit.hasBatchControl))
      setHasExpirationControl(Boolean(productToEdit.hasExpirationControl))
      setIsExpirationRequired(Boolean(productToEdit.isExpirationRequired))
      setDefaultShelfLifeDays(
        productToEdit.defaultShelfLifeDays
          ? String(productToEdit.defaultShelfLifeDays)
          : '',
      )
      setMinReceivingShelfLifeDays(
        productToEdit.minReceivingShelfLifeDays
          ? String(productToEdit.minReceivingShelfLifeDays)
          : '',
      )
      setMinDeliveryShelfLifeDays(
        productToEdit.minDeliveryShelfLifeDays
          ? String(productToEdit.minDeliveryShelfLifeDays)
          : '',
      )
      setWarningShelfLifeDays(
        productToEdit.warningShelfLifeDays
          ? String(productToEdit.warningShelfLifeDays)
          : '',
      )

      // Simple product prices
      const defaultVar =
        productToEdit.variations?.find((v) => v.isDefault) ||
        productToEdit.variations?.[0]
      if (defaultVar) {
        setPrice(defaultVar.price ? Number(defaultVar.price) : 0)
        setPromotionalPrice(
          defaultVar.promotionalPrice ? Number(defaultVar.promotionalPrice) : 0,
        )
        setCostPrice(defaultVar.costPrice ? Number(defaultVar.costPrice) : 0)
        setSku(defaultVar.sku || '')
        setBarcode(defaultVar.barcode || '')
      } else {
        setPrice(0)
        setPromotionalPrice(0)
        setCostPrice(0)
        setSku('')
        setBarcode('')
      }

      // Populate Options & Variations if variable
      if (productToEdit.options && productToEdit.options.length > 0) {
        setOptions(
          productToEdit.options.map((opt) => ({
            name: opt.name,
            values: opt.values ? opt.values.map((v) => v.value) : [],
            valueInput: '',
          })),
        )
      } else {
        setOptions([])
      }

      if (productToEdit.variations && productToEdit.variations.length > 0) {
        setVariations(
          productToEdit.variations.map((v) => {
            const optVals: Record<string, string> = {}
            if (v.values) {
              v.values.forEach((valItem) => {
                if (
                  valItem.optionValue?.option?.name &&
                  valItem.optionValue?.value
                ) {
                  optVals[valItem.optionValue.option.name] =
                    valItem.optionValue.value
                }
              })
            }
            return {
              sku: v.sku,
              barcode: v.barcode || '',
              price: v.price,
              promotionalPrice: v.promotionalPrice || '',
              costPrice: v.costPrice || '',
              status: (v.status as 'active' | 'inactive') || 'active',
              optionValues: optVals,
            }
          }),
        )
      } else {
        setVariations([])
      }

      // Populate Media Items
      if (productToEdit.medias && productToEdit.medias.length > 0) {
        setMediaItems(
          productToEdit.medias.map((m) => {
            const f = m.file as { publicUrl?: string; objectKey?: string }
            return {
              fileId: m.fileId,
              previewUrl:
                f.publicUrl ||
                `https://pub-8c380f0027ec4da2864242b9f076f3fd.r2.dev/${f.objectKey}`,
              originalName: m.file.originalName,
              isMain: m.isMain,
            }
          }),
        )
      } else {
        setMediaItems([])
      }
    } else {
      // New Product
      setStoreId(defaultStoreId || storesList[0]?.id || '')
      setCategoryId(categoriesList[0]?.id || '')
      setBrandId('')
      setName('')
      setSlug('')
      setIsSlugUserModified(false)
      setShortDescription('')
      setFullDescription('')
      setType('simple')
      setStatus('draft')
      setIsPublished(false)
      setIsFeatured(false)

      setPrice(0)
      setPromotionalPrice(0)
      setCostPrice(0)
      setSku('')
      setBarcode('')

      setWeight('')
      setWidth('')
      setHeight('')
      setLength('')
      setMetaTitle('')
      setMetaDescription('')

      setHasBatchControl(false)
      setHasExpirationControl(false)
      setIsExpirationRequired(false)
      setDefaultShelfLifeDays('')
      setMinReceivingShelfLifeDays('')
      setMinDeliveryShelfLifeDays('')
      setWarningShelfLifeDays('')

      setOptions([])
      setNewOptionName('')
      setVariations([])
      setMediaItems([])
    }

    const timer = setTimeout(() => {
      setInitialSnapshot(
        JSON.stringify({
          name: productToEdit?.name || '',
          slug: productToEdit?.slug || '',
          shortDescription: productToEdit?.shortDescription || '',
          fullDescription: productToEdit?.fullDescription || '',
          type: productToEdit?.type || 'simple',
          status: productToEdit?.status || 'draft',
          isPublished: Boolean(productToEdit?.isPublished),
          isFeatured: Boolean(productToEdit?.isFeatured),
          storeId:
            productToEdit?.storeId || defaultStoreId || storesList[0]?.id || '',
          categoryId: productToEdit?.categoryId || categoriesList[0]?.id || '',
          brandId: productToEdit?.brandId || '',
          price: productToEdit?.variations?.[0]?.price
            ? Number(productToEdit.variations[0].price)
            : 0,
          promotionalPrice: productToEdit?.variations?.[0]?.promotionalPrice
            ? Number(productToEdit.variations[0].promotionalPrice)
            : 0,
          costPrice: productToEdit?.variations?.[0]?.costPrice
            ? Number(productToEdit.variations[0].costPrice)
            : 0,
          sku: productToEdit?.variations?.[0]?.sku || '',
          barcode: productToEdit?.variations?.[0]?.barcode || '',
          mediaItems: productToEdit?.medias
            ? productToEdit.medias.map((m) => m.fileId)
            : [],
          weight: productToEdit?.weight ? String(productToEdit.weight) : '',
          width: productToEdit?.width ? String(productToEdit.width) : '',
          height: productToEdit?.height ? String(productToEdit.height) : '',
          length: productToEdit?.length ? String(productToEdit.length) : '',
          metaTitle: productToEdit?.metaTitle || '',
          metaDescription: productToEdit?.metaDescription || '',
          hasBatchControl: Boolean(productToEdit?.hasBatchControl),
          hasExpirationControl: Boolean(productToEdit?.hasExpirationControl),
        }),
      )
    }, 50)
    return () => clearTimeout(timer)
  }, [open, productToEdit, defaultStoreId, storesList, categoriesList])

  const isFormDirty = isEditing
    ? JSON.stringify({
        name,
        slug,
        shortDescription,
        fullDescription,
        type,
        status,
        isPublished,
        isFeatured,
        storeId,
        categoryId,
        brandId,
        price,
        promotionalPrice,
        costPrice,
        sku,
        barcode,
        mediaItems,
        weight,
        width,
        height,
        length,
        metaTitle,
        metaDescription,
        hasBatchControl,
        hasExpirationControl,
      }) !== initialSnapshot
    : name.trim().length > 0

  // Handle Name Input Change (Auto Slug)
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isSlugUserModified) {
      setSlug(sanitizeSlug(val))
    }
  }

  const handleSlugChange = (val: string) => {
    setIsSlugUserModified(true)
    setSlug(sanitizeSlug(val))
  }

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const selectedStoreId = storeId || defaultStoreId || storesList[0]?.id
    if (!selectedStoreId) {
      toast.error('Selecione uma loja antes de enviar mídias.')
      return
    }

    setIsUploadingMedia(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file) continue

        let fileId: string | null = null
        let publicUrl: string | null = null

        // Try direct Presigned PUT upload first
        try {
          const presignedRes = await apiClient<{
            uploadUrl: string
            fileId: string
            publicUrl: string
            data?: { uploadUrl: string; fileId: string; publicUrl: string }
          }>('/files/presigned-url', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              size: file.size,
              purpose: 'product_image',
              storeId: selectedStoreId,
            }),
          })
          const presigned = presignedRes.data || presignedRes

          const putRes = await fetch(presigned.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          })

          if (putRes.ok) {
            const finalizedRes = await apiClient<{
              id: string
              publicUrl: string
              data?: { id: string; publicUrl: string }
            }>(`/files/${presigned.fileId}/finalize`, { method: 'POST' })
            const finalized = finalizedRes.data || finalizedRes
            fileId = finalized.id || presigned.fileId
            publicUrl = finalized.publicUrl || presigned.publicUrl
          }
        } catch {
          // Presigned URL or direct PUT failed — proceed to API multipart fallback
        }

        // Fallback: Upload directly to Fastify API endpoint -> Cloudflare R2
        if (!fileId) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('purpose', 'product_image')
          formData.append('storeId', selectedStoreId)

          const uploadRes = await apiClient<{
            id: string
            publicUrl: string
            data?: { id: string; publicUrl: string }
          }>('/files/upload', {
            method: 'POST',
            body: formData,
          })
          const uploadedFile = uploadRes.data || uploadRes
          fileId = uploadedFile.id
          publicUrl = uploadedFile.publicUrl
        }

        if (fileId) {
          const localPreview = publicUrl || URL.createObjectURL(file)
          setMediaItems((prev) => [
            ...prev,
            {
              fileId: fileId!,
              previewUrl: localPreview,
              originalName: file.name,
              isMain: prev.length === 0,
            },
          ])
        }
      }

      toast.success('Imagem(ns) enviada(s) com sucesso!')
    } catch (err: unknown) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Erro ao enviar imagem',
      )
    } finally {
      setIsUploadingMedia(false)
      e.target.value = ''
    }
  }

  // Set Main Image
  const setMainImage = (fileId: string) => {
    setMediaItems((prev) =>
      prev.map((item) => ({
        ...item,
        isMain: item.fileId === fileId,
      })),
    )
  }

  // Remove Image
  const removeImage = (fileId: string) => {
    setMediaItems((prev) => {
      const filtered = prev.filter((item) => item.fileId !== fileId)
      // If we removed the main image, make the first one main
      if (filtered.length > 0 && !filtered.some((i) => i.isMain)) {
        filtered[0]!.isMain = true
      }
      return filtered
    })
  }

  // Options & Variations Management
  const addOption = () => {
    if (!newOptionName.trim()) return
    if (
      options.some(
        (o) => o.name.toLowerCase() === newOptionName.trim().toLowerCase(),
      )
    ) {
      toast.error('Já existe uma opção com esse nome.')
      return
    }
    setOptions([
      ...options,
      { name: newOptionName.trim(), values: [], valueInput: '' },
    ])
    setNewOptionName('')
  }

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const addOptionValue = (optionIndex: number) => {
    const opt = options[optionIndex]
    if (!opt || !opt.valueInput?.trim()) return

    const val = opt.valueInput.trim()
    if (opt.values.includes(val)) {
      toast.error('Este valor já foi adicionado.')
      return
    }

    const updatedOptions = [...options]
    updatedOptions[optionIndex] = {
      ...opt,
      values: [...opt.values, val],
      valueInput: '',
    }
    setOptions(updatedOptions)
  }

  const removeOptionValue = (optionIndex: number, valIndex: number) => {
    const opt = options[optionIndex]
    if (!opt) return

    const updatedOptions = [...options]
    updatedOptions[optionIndex] = {
      ...opt,
      values: opt.values.filter((_, i) => i !== valIndex),
    }
    setOptions(updatedOptions)
  }

  // Auto Generate Variations from Options
  const generateVariationsFromOptions = () => {
    if (options.length === 0 || options.some((o) => o.values.length === 0)) {
      toast.error(
        'Adicione pelo menos 1 valor em cada opção para gerar variações.',
      )
      return
    }

    // Cartesian product helper
    const cartesian = (
      acc: Record<string, string>[],
      optIdx: number,
    ): Record<string, string>[] => {
      if (optIdx >= options.length) return acc
      const currentOpt = options[optIdx]!
      const nextAcc: Record<string, string>[] = []

      for (const item of acc) {
        for (const val of currentOpt.values) {
          nextAcc.push({
            ...item,
            [currentOpt.name]: val,
          })
        }
      }
      return cartesian(nextAcc, optIdx + 1)
    }

    const combinations = cartesian([{}], 0)
    const baseSlug = slug || sanitizeSlug(name) || 'PROD'

    const generatedVars: ProductVariationItem[] = combinations.map(
      (combo, idx) => {
        const comboSuffix = Object.values(combo).join('-').toUpperCase()
        const comboSku = `${baseSlug.toUpperCase().slice(0, 6)}-${comboSuffix}-${idx + 1}`

        return {
          sku: comboSku,
          barcode: '',
          price: price || 0,
          promotionalPrice: promotionalPrice || '',
          costPrice: costPrice || '',
          status: 'active',
          optionValues: combo,
        }
      },
    )

    setVariations(generatedVars)
    toast.success(`${generatedVars.length} variação(ões) gerada(s)!`)
  }

  const updateVariationField = (
    index: number,
    field: keyof ProductVariationItem,
    val: unknown,
  ) => {
    setVariations((prev) => {
      const next = [...prev]
      next[index] = { ...next[index]!, [field]: val }
      return next
    })
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiClient('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.dropdown() })
      toast.success('Produto criado com sucesso!')
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível criar o produto')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiClient(`/products/${productToEdit!.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] })
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.dropdown() })
      toast.success('Produto atualizado com sucesso!')
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      showError(err, 'Atenção: Não foi possível atualizar o produto')
    },
  })

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('O nome do produto é obrigatório.')
      return
    }

    if (!storeId && !defaultStoreId) {
      toast.error('Selecione uma loja vinculada.')
      return
    }

    if (!categoryId) {
      toast.error('Selecione uma categoria.')
      return
    }

    if (type === 'simple' && (!price || price <= 0)) {
      toast.error(
        'Informe um preço de venda maior que zero para o produto simples.',
      )
      return
    }

    if (type === 'variable' && variations.length === 0) {
      toast.error('Produtos variáveis devem possuir pelo menos 1 variação.')
      return
    }

    const mainMedia = mediaItems.find((m) => m.isMain) || mediaItems[0]
    const mediaFileIds = mediaItems.map((m) => m.fileId)

    const payload: Record<string, unknown> = {
      storeId: storeId || defaultStoreId,
      categoryId,
      brandId: brandId || null,
      name: name.trim(),
      slug: slug ? sanitizeSlug(slug) : sanitizeSlug(name),
      shortDescription: shortDescription.trim() || null,
      fullDescription: fullDescription.trim() || null,
      type,
      status,
      isPublished,
      isFeatured,

      weight: weight ? Number(weight) : null,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      length: length ? Number(length) : null,

      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,

      hasBatchControl,
      hasExpirationControl,
      isExpirationRequired,
      defaultShelfLifeDays: defaultShelfLifeDays
        ? Number(defaultShelfLifeDays)
        : null,
      minReceivingShelfLifeDays: minReceivingShelfLifeDays
        ? Number(minReceivingShelfLifeDays)
        : null,
      minDeliveryShelfLifeDays: minDeliveryShelfLifeDays
        ? Number(minDeliveryShelfLifeDays)
        : null,
      warningShelfLifeDays: warningShelfLifeDays
        ? Number(warningShelfLifeDays)
        : null,

      mediaFileIds,
      mainMediaFileId: mainMedia?.fileId || null,
    }

    if (type === 'simple') {
      payload.price = price
      payload.promotionalPrice = promotionalPrice || null
      payload.costPrice = costPrice || null
      payload.sku = sku.trim() || undefined
    } else {
      payload.options = options.map((opt, i) => ({
        name: opt.name,
        position: i,
        values: opt.values,
      }))

      payload.variations = variations.map((v, i) => ({
        sku: v.sku.trim(),
        barcode: v.barcode?.trim() || null,
        price: Number(v.price),
        promotionalPrice: v.promotionalPrice
          ? Number(v.promotionalPrice)
          : null,
        costPrice: v.costPrice ? Number(v.costPrice) : null,
        status: v.status,
        isDefault: i === 0,
        position: i,
        optionValues: v.optionValues,
      }))
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-185 max-h-[90vh] min-h-150 w-full max-w-4xl flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {isEditing
              ? 'Atualize as informações comerciais, preços, mídias e variações do produto.'
              : 'Cadastre um novo produto simples ou variável para disponibilizar no catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-1 pb-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex w-full flex-1 flex-col"
            >
              <TabsList className="mb-5 grid w-full shrink-0 grid-cols-6 bg-zinc-900/80 p-1">
                <TabsTrigger
                  value="geral"
                  className="flex items-center space-x-1.5 text-xs"
                >
                  <RiInformationLine className="h-4 w-4" />
                  <span>Geral</span>
                </TabsTrigger>
                <TabsTrigger
                  value="preco"
                  className="flex items-center space-x-1.5 text-xs"
                >
                  <RiPriceTag3Line className="h-4 w-4" />
                  <span>Preço</span>
                </TabsTrigger>
                <TabsTrigger
                  value="validade"
                  className="flex items-center space-x-1.5 text-xs"
                >
                  <RiCalendarEventLine className="h-4 w-4" />
                  <span>Lote & Validade</span>
                </TabsTrigger>
                <TabsTrigger
                  value="variacoes"
                  disabled={type !== 'variable'}
                  className="flex items-center space-x-1.5 text-xs"
                >
                  <RiStackLine className="h-4 w-4" />
                  <span>Variações</span>
                </TabsTrigger>
                <TabsTrigger
                  value="midias"
                  className="flex items-center space-x-1.5 text-xs"
                >
                  <RiImageAddLine className="h-4 w-4" />
                  <span>Imagens ({mediaItems.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="frete-seo"
                  className="flex items-center space-x-1.5 text-xs"
                >
                  <RiTruckLine className="h-4 w-4" />
                  <span>Frete & SEO</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: GERAL */}
              <TabsContent
                value="geral"
                className="flex-1 space-y-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5.5"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Loja Vinculada <span className="text-rose-400">*</span>
                    </label>
                    <NativeSelect
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      disabled={Boolean(defaultStoreId) || isEditing}
                    >
                      <option value="">Selecione uma loja...</option>
                      {storesList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Categoria <span className="text-rose-400">*</span>
                    </label>
                    <NativeSelect
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Marca
                    </label>
                    <NativeSelect
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                    >
                      <option value="">Nenhuma (Sem marca)</option>
                      {brandsList.map((br) => (
                        <option key={br.id} value={br.id}>
                          {br.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Nome do Produto <span className="text-rose-400">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="Ex: Queijo Canastra Curado 500g"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Slug Único (URL)
                    </label>
                    <Input
                      type="text"
                      placeholder="queijo-canastra-curado-500g"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="font-mono text-zinc-300 placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Tipo do Produto
                    </label>
                    <NativeSelect
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value as 'simple' | 'variable')
                      }
                      disabled={isEditing}
                    >
                      <option value="simple">Produto Simples (1 SKU)</option>
                      <option value="variable">
                        Produto Variável (Opções/Tamanhos)
                      </option>
                    </NativeSelect>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Status de Cadastro
                    </label>
                    <NativeSelect
                      value={status}
                      onChange={(e) =>
                        setStatus(
                          e.target.value as
                            'draft' | 'active' | 'inactive' | 'archived',
                        )
                      }
                    >
                      <option value="draft">Rascunho (Draft)</option>
                      <option value="active">Ativo (Active)</option>
                      <option value="inactive">Inativo (Inactive)</option>
                      <option value="archived">Arquivado (Archived)</option>
                    </NativeSelect>
                  </div>

                  <div className="flex items-center space-x-2.5 pt-6">
                    <Checkbox
                      id="isFeatured"
                      checked={isFeatured}
                      onCheckedChange={(checked) =>
                        setIsFeatured(Boolean(checked))
                      }
                      className="cursor-pointer"
                    />
                    <label
                      htmlFor="isFeatured"
                      className="cursor-pointer text-xs font-medium whitespace-nowrap text-zinc-300 select-none"
                    >
                      Produto em Destaque
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Descrição Curta (Resumo de Listagem)
                  </label>
                  <Input
                    type="text"
                    placeholder="Breve resumo artesanal do produto para cartões e busca"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Descrição Completa (Ficha Técnica & Detalhes)
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Histórico do produtor, processo de maturação, harmonização, ingredientes..."
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* TAB 2: PREÇO & ESTOQUE */}
              <TabsContent
                value="preco"
                className="flex-1 space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6"
              >
                {type === 'variable' && (
                  <div className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-3 text-xs text-amber-300">
                    ℹ️ Para produtos variáveis, os preços e SKUs são definidos
                    individualmente para cada variação na aba{' '}
                    <strong>Variações</strong>.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Preço de Venda{' '}
                      {type === 'simple' && (
                        <span className="text-rose-400">*</span>
                      )}
                    </label>
                    <PriceInput
                      value={price}
                      onValueChange={setPrice}
                      disabled={type === 'variable'}
                      placeholder="R$ 0,00"
                      required={type === 'simple'}
                      className="text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Preço Promocional
                    </label>
                    <PriceInput
                      value={promotionalPrice}
                      onValueChange={setPromotionalPrice}
                      disabled={type === 'variable'}
                      placeholder="R$ 0,00 (opcional)"
                      className="text-emerald-400 placeholder:text-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Preço de Custo
                    </label>
                    <PriceInput
                      value={costPrice}
                      onValueChange={setCostPrice}
                      disabled={type === 'variable'}
                      placeholder="R$ 0,00 (opcional)"
                      className="text-zinc-300 placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Código SKU
                    </label>
                    <Input
                      type="text"
                      disabled={type === 'variable'}
                      placeholder="Gerado automaticamente se vazio"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="font-mono text-zinc-200 placeholder:text-zinc-600"
                    />
                    <span className="mt-1 block text-[11px] text-zinc-500">
                      Identificador de estoque único (ex: QC-CANASTRA-500G).
                    </span>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Código de Barras (EAN / GTIN)
                    </label>
                    <Input
                      type="text"
                      disabled={type === 'variable'}
                      placeholder="7891234567890"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="font-mono text-zinc-200 placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB: LOTE & VALIDADE */}
              <TabsContent
                value="validade"
                className="flex-1 space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5.5"
              >
                <div className="rounded-xl border border-emerald-950/60 bg-emerald-950/20 p-4">
                  <h4 className="text-xs font-semibold text-emerald-400">
                    Controle de Lotes, Validade e Rastreabilidade (FEFO)
                  </h4>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Defina se este produto exige identificação de lote e
                    rastreamento de data de validade. Produtos alimentícios
                    devem, como padrão, exigir controle de lote e validade.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                    <div>
                      <span className="block text-xs font-semibold text-zinc-200">
                        Controle por Lote
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Exigir código do lote no recebimento
                      </span>
                    </div>
                    <Checkbox
                      checked={hasBatchControl}
                      onCheckedChange={(checked) =>
                        setHasBatchControl(!!checked)
                      }
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                    <div>
                      <span className="block text-xs font-semibold text-zinc-200">
                        Controle de Validade
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Rastrear vencimento de lotes (FEFO)
                      </span>
                    </div>
                    <Checkbox
                      checked={hasExpirationControl}
                      onCheckedChange={(checked) =>
                        setHasExpirationControl(!!checked)
                      }
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                    <div>
                      <span className="block text-xs font-semibold text-zinc-200">
                        Validade Obrigatória
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Bloquear recebimento sem validade
                      </span>
                    </div>
                    <Checkbox
                      checked={isExpirationRequired}
                      onCheckedChange={(checked) =>
                        setIsExpirationRequired(!!checked)
                      }
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {(hasBatchControl || hasExpirationControl) && (
                  <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Validade Padrão (dias)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 180"
                        value={defaultShelfLifeDays}
                        onChange={(e) =>
                          setDefaultShelfLifeDays(e.target.value)
                        }
                        className="font-mono text-zinc-200"
                      />
                      <span className="mt-1 block text-[11px] text-zinc-500">
                        Sugestão no cadastro do lote.
                      </span>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Mínimo no Recebimento (dias)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 60"
                        value={minReceivingShelfLifeDays}
                        onChange={(e) =>
                          setMinReceivingShelfLifeDays(e.target.value)
                        }
                        className="font-mono text-zinc-200"
                      />
                      <span className="mt-1 block text-[11px] text-zinc-500">
                        Validade mínima aceita ao receber.
                      </span>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Mínimo na Entrega (dias)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 15"
                        value={minDeliveryShelfLifeDays}
                        onChange={(e) =>
                          setMinDeliveryShelfLifeDays(e.target.value)
                        }
                        className="font-mono text-zinc-200"
                      />
                      <span className="mt-1 block text-[11px] text-zinc-500">
                        Margem mínima ao enviar ao cliente.
                      </span>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Janela de Alerta (dias)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 30"
                        value={warningShelfLifeDays}
                        onChange={(e) =>
                          setWarningShelfLifeDays(e.target.value)
                        }
                        className="font-mono text-amber-400"
                      />
                      <span className="mt-1 block text-[11px] text-zinc-500">
                        Faixa de aviso &quot;Próximo do Vencimento&quot;.
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: VARIAÇÕES */}
              <TabsContent
                value="variacoes"
                className="flex-1 space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6"
              >
                {type !== 'variable' ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-400">
                    Altere o tipo do produto para{' '}
                    <strong>Produto Variável</strong> na aba Geral para
                    habilitar a gestão de opções e variações.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Define Options */}
                    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <h3 className="text-sm font-semibold text-zinc-200">
                        1. Definir Opções do Produto
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Crie os atributos configuráveis do produto (ex: Sabor,
                        Peso, Tamanho) e adicione seus respectivos valores.
                      </p>

                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder="Nome da opção (ex: Sabor, Peso, Maturação)"
                          value={newOptionName}
                          onChange={(e) => setNewOptionName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={addOption}
                          className="inline-flex cursor-pointer items-center space-x-1.5 rounded-xl bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
                        >
                          <RiAddLine className="h-4 w-4 text-emerald-400" />
                          <span>Adicionar Opção</span>
                        </Button>
                      </div>

                      {/* Options List */}
                      {options.length > 0 && (
                        <div className="space-y-3 pt-2">
                          {options.map((opt, optIdx) => (
                            <div
                              key={opt.name}
                              className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950 p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                                  {opt.name}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(optIdx)}
                                  className="h-6 w-6 text-zinc-500 hover:text-rose-400"
                                >
                                  <RiCloseLine className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {opt.values.map((val, valIdx) => (
                                  <span
                                    key={val}
                                    className="inline-flex items-center space-x-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-200"
                                  >
                                    <span>{val}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        removeOptionValue(optIdx, valIdx)
                                      }
                                      className="h-4 w-4 p-0 text-zinc-500 hover:text-rose-400"
                                    >
                                      <RiCloseLine className="h-3 w-3" />
                                    </Button>
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center space-x-2 pt-1">
                                <Input
                                  type="text"
                                  placeholder={`Novo valor para ${opt.name} (ex: 500g, Curado)`}
                                  value={opt.valueInput || ''}
                                  onChange={(e) => {
                                    const next = [...options]
                                    next[optIdx]!.valueInput = e.target.value
                                    setOptions(next)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      addOptionValue(optIdx)
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => addOptionValue(optIdx)}
                                  className="h-9 px-3 text-xs"
                                >
                                  + Inserir
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateVariationsFromOptions}
                            className="w-full border-emerald-800/80 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/80"
                          >
                            ⚡ Gerar Matriz de Variações Automaticamente
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Variations Grid / Table */}
                    {variations.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-zinc-200">
                          2. Variações Geradas ({variations.length})
                        </h3>

                        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                          {variations.map((vItem, vIdx) => (
                            <div
                              key={vIdx}
                              className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs"
                            >
                              <div className="flex items-center justify-between font-semibold text-zinc-200">
                                <span className="text-emerald-400">
                                  {Object.entries(vItem.optionValues)
                                    .map(([k, val]) => `${k}: ${val}`)
                                    .join(' | ')}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setVariations((prev) =>
                                      prev.filter((_, i) => i !== vIdx),
                                    )
                                  }
                                  className="h-6 w-6 text-zinc-500 hover:text-rose-400"
                                >
                                  <RiDeleteBin6Line className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div>
                                  <label className="mb-0.5 block text-[10px] text-zinc-400">
                                    SKU *
                                  </label>
                                  <Input
                                    type="text"
                                    required
                                    value={vItem.sku}
                                    onChange={(e) =>
                                      updateVariationField(
                                        vIdx,
                                        'sku',
                                        e.target.value,
                                      )
                                    }
                                    className="font-mono text-xs text-zinc-200"
                                  />
                                </div>

                                <div>
                                  <label className="mb-0.5 block text-[10px] text-zinc-400">
                                    Preço *
                                  </label>
                                  <PriceInput
                                    value={vItem.price}
                                    onValueChange={(val) =>
                                      updateVariationField(vIdx, 'price', val)
                                    }
                                    required
                                    className="font-mono text-xs text-zinc-200"
                                  />
                                </div>

                                <div>
                                  <label className="mb-0.5 block text-[10px] text-zinc-400">
                                    Promoção
                                  </label>
                                  <PriceInput
                                    value={vItem.promotionalPrice || 0}
                                    onValueChange={(val) =>
                                      updateVariationField(
                                        vIdx,
                                        'promotionalPrice',
                                        val || null,
                                      )
                                    }
                                    className="font-mono text-xs text-emerald-400"
                                  />
                                </div>

                                <div>
                                  <label className="mb-0.5 block text-[10px] text-zinc-400">
                                    Custo
                                  </label>
                                  <PriceInput
                                    value={vItem.costPrice || 0}
                                    onValueChange={(val) =>
                                      updateVariationField(
                                        vIdx,
                                        'costPrice',
                                        val || null,
                                      )
                                    }
                                    className="font-mono text-xs text-zinc-400"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: MÍDIAS & IMAGENS */}
              <TabsContent
                value="midias"
                className="flex-1 space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Imagens do Produto
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Envie imagens de alta qualidade do produto artesanal. A
                        primeira imagem é a capa principal por padrão.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center space-x-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500">
                      <RiUpload2Line className="h-4 w-4" />
                      <span>
                        {isUploadingMedia ? 'Enviando...' : 'Adicionar Imagem'}
                      </span>
                      <Input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileUpload}
                        disabled={isUploadingMedia}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Previews Grid */}
                  {mediaItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {mediaItems.map((item) => (
                        <div
                          key={item.fileId}
                          className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-zinc-900 p-2 transition-all ${
                            item.isMain
                              ? 'border-amber-500/80 ring-1 ring-amber-500/30'
                              : 'border-zinc-800'
                          }`}
                        >
                          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.previewUrl}
                              alt={item.originalName}
                              className="h-full w-full object-cover"
                            />
                            {item.isMain && (
                              <span className="absolute top-2 left-2 inline-flex items-center space-x-1 rounded-lg bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-zinc-950 uppercase shadow-md">
                                <RiStarFill className="h-3 w-3" />
                                <span>Principal</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between px-1">
                            <span className="max-w-25 truncate text-[11px] text-zinc-400">
                              {item.originalName}
                            </span>
                            <div className="flex items-center space-x-1">
                              {!item.isMain && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Marcar como Principal"
                                  onClick={() => setMainImage(item.fileId)}
                                  className="h-6 w-6 p-0 text-zinc-400 hover:text-amber-400"
                                >
                                  <RiStarLine className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                title="Remover Imagem"
                                onClick={() => removeImage(item.fileId)}
                                className="h-6 w-6 p-0 text-zinc-400 hover:text-rose-400"
                              >
                                <RiDeleteBin6Line className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                      <RiImageAddLine className="mb-2 h-10 w-10 text-zinc-600" />
                      <p className="text-sm font-medium text-zinc-300">
                        Nenhuma imagem enviada
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Carregue arquivos nos formatos JPG, PNG ou WebP de até 5
                        MB.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 5: FRETE & SEO */}
              <TabsContent
                value="frete-seo"
                className="flex-1 space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Dimensões para Cálculo de Frete
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Peso (gramas)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 500"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Largura (cm)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 15"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Altura (cm)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 10"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Comprimento (cm)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 15"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <hr className="my-4 border-zinc-800/80" />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Otimização SEO (Buscadores)
                  </h3>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Meta Título (Meta Title)
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Queijo Canastra Artesanal Curado 500g — Serra da Canastra"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Meta Descrição (Meta Description)
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Descrição otimizada para ser exibida nos resultados do Google..."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="bg-zinc-950 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                !isFormDirty ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              <RiCheckLine className="h-4 w-4" />
              <span>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar Alterações'
                    : 'Cadastrar Produto'}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
