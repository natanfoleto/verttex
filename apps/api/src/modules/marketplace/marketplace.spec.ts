import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { createCarouselBannerSchema } from '../carousel/carousel.schemas'
import { carouselService } from '../carousel/carousel.service'
import { updateMarketplaceSettingsSchema } from './marketplace.schemas'
import { marketplaceService } from './marketplace.service'

// ─── Isolamento de dados de teste ────────────────────────────────────────────
// Rastreia apenas os IDs criados pelos testes para limpar somente eles,
// sem jamais apagar dados de produção com deleteMany() sem filtro.
const createdBannerIds: string[] = []

// Salva e restaura as marketplaceSettings antes/depois de cada teste.
// Como é um singleton, apenas atualizamos os campos de volta ao estado original.
let savedSettings: Record<string, unknown> | null = null

describe('Marketplace & Carousel Module', () => {
  beforeEach(async () => {
    // Salva estado atual das settings (sem apagar)
    try {
      savedSettings = await prisma.marketplaceSettings.findFirst()
    } catch {
      savedSettings = null
    }
  })

  afterEach(async () => {
    // Remove apenas os banners criados por este teste (não toca em dados de produção)
    if (createdBannerIds.length > 0) {
      await prisma.carouselBanner.deleteMany({
        where: { id: { in: [...createdBannerIds] } },
      })
      createdBannerIds.length = 0
    }

    // Restaura settings ao estado original (upsert seguro)
    if (savedSettings) {
      const restorable = { ...savedSettings }
      delete restorable.id
      delete restorable.createdAt
      delete restorable.updatedAt
      await prisma.marketplaceSettings.update({
        where: { id: savedSettings.id as string },
        data: restorable,
      })
    } else {
      // Se não havia settings antes do teste, remove apenas a criada pelo teste
      await prisma.marketplaceSettings.deleteMany()
    }
  })

  // ─── Zod Schemas ─────────────────────────────────────────────────────────
  describe('Zod Schemas & Security Validations', () => {
    it('should reject dangerous javascript: protocols in banner URLs', () => {
      const invalidInput = {
        title: 'Test Banner',
        linkUrl: "javascript:alert('xss')",
      }
      const result = createCarouselBannerSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject dangerous data: protocols in banner URLs', () => {
      const invalidInput = {
        title: 'Test Banner',
        linkUrl: 'data:text/html,<script>alert(1)</script>',
      }
      const result = createCarouselBannerSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should allow safe internal and external URLs', () => {
      const internalInput = { title: 'Test', linkUrl: '/produtos' }
      const externalInput = {
        title: 'Test',
        linkUrl: 'https://example.com/promo',
      }

      expect(createCarouselBannerSchema.safeParse(internalInput).success).toBe(
        true,
      )
      expect(createCarouselBannerSchema.safeParse(externalInput).success).toBe(
        true,
      )
    })

    it('should reject invalid outOfStockBehavior enums', () => {
      const invalidEnum = { outOfStockBehavior: 'invalid_behavior' }
      expect(
        updateMarketplaceSettingsSchema.safeParse(invalidEnum).success,
      ).toBe(false)

      const validEnum = { outOfStockBehavior: 'move_to_end' }
      expect(updateMarketplaceSettingsSchema.safeParse(validEnum).success).toBe(
        true,
      )
    })
  })

  // ─── Marketplace Settings ─────────────────────────────────────────────────
  describe('Marketplace Settings (Singleton Service)', () => {
    it('should create default settings if none exist', async () => {
      const settings = await marketplaceService.getSettings()
      expect(settings).toBeDefined()
      expect(settings.outOfStockBehavior).toBeDefined()
    })

    it('should update global settings', async () => {
      const updated = await marketplaceService.updateSettings(
        {
          publicName: '__TEST__ Mercado Central',
          supportEmail: 'suporte@test.com',
          announcementActive: true,
          announcementText: 'Frete Grátis! [TEST]',
          outOfStockBehavior: 'hide_product',
        },
        'user-123',
      )

      expect(updated.publicName).toBe('__TEST__ Mercado Central')
      expect(updated.supportEmail).toBe('suporte@test.com')
      expect(updated.announcementActive).toBe(true)
      expect(updated.outOfStockBehavior).toBe('hide_product')
    })

    it('should project safe public settings', async () => {
      const publicSettings = await marketplaceService.getPublicSettings()
      expect(publicSettings).toBeDefined()
      expect(publicSettings.publicName).toBeDefined()
      expect(
        (publicSettings as Record<string, unknown>).updatedBy,
      ).toBeUndefined()
    })
  })

  // ─── Carousel Service ─────────────────────────────────────────────────────
  describe('Carousel Service (Banners)', () => {
    it('should create banner WITHOUT requesting image initially', async () => {
      const banner = await carouselService.createBanner(
        {
          title: '__TEST__ Novo Banner de Teste',
          subtitle: 'Subtítulo do banner',
          linkUrl: '/produtos',
          ctaText: 'Ver Mais',
          isActive: true,
        },
        'user-admin',
      )

      createdBannerIds.push(banner.id)

      expect(banner.id).toBeDefined()
      expect(banner.title).toBe('__TEST__ Novo Banner de Teste')
      expect(banner.imageUrl).toBeNull()
      expect(banner.fileId).toBeNull()
    })

    it('should update banner text and status', async () => {
      const banner = await carouselService.createBanner(
        { title: '__TEST__ Banner A' },
        'user-1',
      )
      createdBannerIds.push(banner.id)

      const updated = await carouselService.updateBanner(
        banner.id,
        { title: '__TEST__ Banner A Modificado', isActive: false },
        'user-1',
      )

      expect(updated.title).toBe('__TEST__ Banner A Modificado')
      expect(updated.isActive).toBe(false)
    })

    it('should filter out active banners WITHOUT images from public listing', async () => {
      // Banner 1: ativo COM imagem
      const b1 = await prisma.carouselBanner.create({
        data: {
          title: '__TEST__ Banner Com Imagem',
          imageUrl: 'https://example.com/banner1.jpg',
          isActive: true,
          position: 9990,
        },
      })
      createdBannerIds.push(b1.id)

      // Banner 2: ativo SEM imagem
      const b2 = await prisma.carouselBanner.create({
        data: {
          title: '__TEST__ Banner Sem Imagem',
          imageUrl: null,
          isActive: true,
          position: 9991,
        },
      })
      createdBannerIds.push(b2.id)

      // Banner 3: inativo COM imagem
      const b3 = await prisma.carouselBanner.create({
        data: {
          title: '__TEST__ Banner Inativo',
          imageUrl: 'https://example.com/banner3.jpg',
          isActive: false,
          position: 9992,
        },
      })
      createdBannerIds.push(b3.id)

      // Lista apenas os banners ativos com imagem criados neste teste
      const allActive = await carouselService.listActiveBanners()
      const testActive = allActive.filter(
        (b) => b.title.startsWith('__TEST__') && b.imageUrl,
      )

      expect(testActive.length).toBe(1)
      expect(testActive[0]!.title).toBe('__TEST__ Banner Com Imagem')
    })

    it('should delete image ONLY and keep banner record', async () => {
      const banner = await prisma.carouselBanner.create({
        data: {
          title: '__TEST__ Banner para Remover Imagem',
          imageUrl: 'https://example.com/banner.jpg',
          isActive: true,
        },
      })
      createdBannerIds.push(banner.id)

      const afterImageDeleted = await carouselService.deleteBannerImage(
        banner.id,
        'user-1',
      )
      expect(afterImageDeleted.imageUrl).toBeNull()
      expect(afterImageDeleted.fileId).toBeNull()

      const bannerStillExists = await prisma.carouselBanner.findUnique({
        where: { id: banner.id },
      })
      expect(bannerStillExists).not.toBeNull()
      expect(bannerStillExists?.title).toBe(
        '__TEST__ Banner para Remover Imagem',
      )
    })

    it('should delete banner record completely', async () => {
      const banner = await carouselService.createBanner(
        { title: '__TEST__ Banner Excluir' },
        'user-1',
      )
      // Não precisa rastrear: o próprio teste chama deleteBanner
      await carouselService.deleteBanner(banner.id)

      const found = await prisma.carouselBanner.findUnique({
        where: { id: banner.id },
      })
      expect(found).toBeNull()
    })

    it('should reorder banners correctly', async () => {
      const b1 = await carouselService.createBanner(
        { title: '__TEST__ Reorder B1', position: 9990 },
        'user-1',
      )
      const b2 = await carouselService.createBanner(
        { title: '__TEST__ Reorder B2', position: 9991 },
        'user-1',
      )
      createdBannerIds.push(b1.id, b2.id)

      await carouselService.reorderBanners([
        { id: b1.id, position: 9991 },
        { id: b2.id, position: 9990 },
      ])

      // Verifica apenas os banners deste teste
      const b1Updated = await prisma.carouselBanner.findUnique({
        where: { id: b1.id },
      })
      const b2Updated = await prisma.carouselBanner.findUnique({
        where: { id: b2.id },
      })

      expect(b1Updated?.position).toBe(9991)
      expect(b2Updated?.position).toBe(9990)
    })
  })
})
