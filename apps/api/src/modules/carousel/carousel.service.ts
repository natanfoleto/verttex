import { Prisma } from '@prisma/client'

import { prisma } from '../../infrastructure/database/prisma'
import { r2Storage } from '../../infrastructure/storage/r2'
import { AppError } from '../../shared/errors/app-error'

export class CarouselService {
  async listBanners() {
    return prisma.carouselBanner.findMany({
      orderBy: { position: 'asc' },
    })
  }

  async listActiveBanners() {
    return prisma.carouselBanner.findMany({
      where: {
        isActive: true,
        imageUrl: {
          not: null,
        },
        NOT: {
          imageUrl: '',
        },
      },
      orderBy: { position: 'asc' },
    })
  }

  async getBannerById(id: string) {
    const banner = await prisma.carouselBanner.findUnique({ where: { id } })
    if (!banner) {
      throw new AppError('NOT_FOUND', 'Banner não encontrado.', 404)
    }
    return banner
  }

  async createBanner(
    data: {
      title: string
      subtitle?: string | null
      linkUrl?: string | null
      ctaText?: string | null
      position?: number
      isActive?: boolean
    },
    userId: string,
  ) {
    const count = await prisma.carouselBanner.count()
    return prisma.carouselBanner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        linkUrl: data.linkUrl || null,
        ctaText: data.ctaText || null,
        position: data.position ?? count,
        isActive: data.isActive ?? true,
        imageUrl: null,
        fileId: null,
        createdBy: userId,
        updatedBy: userId,
      },
    })
  }

  async updateBanner(
    id: string,
    data: Prisma.CarouselBannerUpdateInput,
    userId: string,
  ) {
    const current = await this.getBannerById(id)

    // Se estiver alterando o fileId/imageUrl diretamente, garantir a limpeza do arquivo antigo
    if (
      data.fileId !== undefined &&
      data.fileId !== current.fileId &&
      current.fileId
    ) {
      await this.cleanupFile(current.fileId, current.imageUrl)
    }

    return prisma.carouselBanner.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    })
  }

  async deleteBannerImage(id: string, userId: string) {
    const banner = await this.getBannerById(id)
    if (!banner.imageUrl && !banner.fileId) {
      return banner
    }

    await this.cleanupFile(banner.fileId, banner.imageUrl)

    return prisma.carouselBanner.update({
      where: { id },
      data: {
        fileId: null,
        imageUrl: null,
        updatedBy: userId,
      },
    })
  }

  async deleteBanner(id: string) {
    const banner = await this.getBannerById(id)

    if (banner.fileId || banner.imageUrl) {
      await this.cleanupFile(banner.fileId, banner.imageUrl)
    }

    return prisma.carouselBanner.delete({ where: { id } })
  }

  async reorderBanners(items: { id: string; position: number }[]) {
    return prisma.$transaction(
      items.map((item) =>
        prisma.carouselBanner.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    )
  }

  /**
   * Remove com segurança o arquivo do R2 e do banco de dados (evita arquivos órfãos)
   */
  private async cleanupFile(fileId?: string | null, imageUrl?: string | null) {
    try {
      if (fileId) {
        const file = await prisma.file.findUnique({ where: { id: fileId } })
        if (file) {
          await r2Storage.deleteFile(file.objectKey)
          await prisma.file.delete({ where: { id: fileId } }).catch(() => null)
        }
      } else if (imageUrl) {
        // Tentar extrair a objectKey a partir da URL se não houver fileId
        const urlParts = imageUrl.split('/uploads/')
        if (urlParts.length > 1) {
          const key = `uploads/${urlParts[1]}`
          await r2Storage.deleteFile(key)
        }
      }
    } catch (err) {
      console.warn(
        'Falha segura ao remover arquivo do R2 durante limpeza do banner:',
        err,
      )
    }
  }
}

export const carouselService = new CarouselService()
