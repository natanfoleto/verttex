import { FastifyRequest } from 'fastify'
import { AppError } from '../../shared/errors/app-error'
import { prisma } from '../../infrastructure/database/prisma'
import { logAudit } from '../../shared/utils/audit'
import {
  CreateProductBody,
  ProductListQuery,
  UpdateProductBody,
} from './products.schemas'

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export class ProductsService {
  /**
   * List products with pagination, store isolation and filters
   */
  static async listProducts(query: ProductListQuery) {
    const { storeId, categoryId, brandId, search, status, isPublished, isFeatured, page, limit } =
      query

    const where: any = {
      deletedAt: null,
    }

    if (storeId) where.storeId = storeId
    if (categoryId) where.categoryId = categoryId
    if (brandId) where.brandId = brandId
    if (status && status !== 'all') where.status = status
    if (isPublished !== undefined) where.isPublished = isPublished
    if (isFeatured !== undefined) where.isFeatured = isFeatured

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        {
          variations: {
            some: {
              sku: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ]
    }

    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, slug: true, status: true } },
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          variations: {
            where: { deletedAt: null },
            include: {
              values: {
                include: {
                  optionValue: {
                    include: { option: true },
                  },
                },
              },
            },
            orderBy: { position: 'asc' },
          },
          medias: {
            include: { file: true },
            orderBy: [{ isMain: 'desc' }, { position: 'asc' }],
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get single product by ID or slug
   */
  static async getProduct(idOrSlug: string, storeId?: string) {
    const where: any = {
      deletedAt: null,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    }
    if (storeId) where.storeId = storeId

    const product = await prisma.product.findFirst({
      where,
      include: {
        store: { select: { id: true, name: true, slug: true, status: true } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        options: {
          include: { values: { orderBy: { position: 'asc' } } },
          orderBy: { position: 'asc' },
        },
        variations: {
          where: { deletedAt: null },
          include: {
            values: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        medias: {
          include: { file: true },
          orderBy: [{ isMain: 'desc' }, { position: 'asc' }],
        },
      },
    })

    if (!product) {
      throw new AppError('NOT_FOUND', 'Produto não encontrado', 404)
    }

    return product
  }

  /**
   * Create new Product (Simple or Variable)
   */
  static async createProduct(
    body: CreateProductBody,
    userId: string,
    req?: FastifyRequest
  ) {
    // 1. Verify Store exists
    const store = await prisma.store.findFirst({
      where: { id: body.storeId, deletedAt: null },
    })
    if (!store) {
      throw new AppError('NOT_FOUND', 'Loja vinculada não encontrada', 404)
    }

    // 2. Verify Category exists
    const category = await prisma.category.findFirst({
      where: { id: body.categoryId, deletedAt: null },
    })
    if (!category) {
      throw new AppError('NOT_FOUND', 'Categoria vinculada não encontrada', 404)
    }

    // 3. Generate slug
    const finalSlug = body.slug ? slugify(body.slug) : slugify(body.name)
    const existingSlug = await prisma.product.findUnique({
      where: {
        storeId_slug: {
          storeId: body.storeId,
          slug: finalSlug,
        },
      },
    })
    if (existingSlug && !existingSlug.deletedAt) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Já existe um produto com o slug "${finalSlug}" nesta loja`,
        400
      )
    }

    // Validation for simple products
    if (body.type === 'simple' && (!body.price || body.price <= 0)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Produtos simples devem possuir um preço de venda válido maior que zero',
        400
      )
    }

    // 4. Create Product with options & variations in a transaction
    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          storeId: body.storeId,
          categoryId: body.categoryId,
          brandId: body.brandId || null,
          name: body.name,
          slug: finalSlug,
          shortDescription: body.shortDescription || null,
          fullDescription: body.fullDescription || null,
          type: body.type,
          status: body.status,
          isPublished: body.isPublished,
          isFeatured: body.isFeatured,
          weight: body.weight || null,
          width: body.width || null,
          height: body.height || null,
          length: body.length || null,
          metaTitle: body.metaTitle || null,
          metaDescription: body.metaDescription || null,
          createdBy: userId,
          updatedBy: userId,
        },
      })

      // Generate default single variation for Simple Product
      if (body.type === 'simple') {
        const generatedSku = body.sku || `${finalSlug.toUpperCase().slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`
        await tx.productVariation.create({
          data: {
            productId: createdProduct.id,
            sku: generatedSku,
            price: body.price!,
            promotionalPrice: body.promotionalPrice || null,
            costPrice: body.costPrice || null,
            isDefault: true,
            status: 'active',
            weight: body.weight || null,
            width: body.width || null,
            height: body.height || null,
            length: body.length || null,
          },
        })
      } else if (body.type === 'variable') {
        // Create options & values
        const optionValueMap = new Map<string, string>()

        for (let i = 0; i < body.options.length; i++) {
          const opt = body.options[i]
          if (!opt) continue

          const createdOption = await tx.productOption.create({
            data: {
              productId: createdProduct.id,
              name: opt.name,
              position: opt.position ?? i,
            },
          })

          for (let j = 0; j < opt.values.length; j++) {
            const valName = opt.values[j]
            if (!valName) continue

            const createdVal = await tx.productOptionValue.create({
              data: {
                optionId: createdOption.id,
                value: valName,
                position: j,
              },
            })
            optionValueMap.set(`${opt.name}:${valName}`, createdVal.id)
          }
        }

        // Create variations
        for (let k = 0; k < body.variations.length; k++) {
          const varItem = body.variations[k]
          if (!varItem) continue

          const createdVar = await tx.productVariation.create({
            data: {
              productId: createdProduct.id,
              sku: varItem.sku,
              barcode: varItem.barcode || null,
              price: varItem.price,
              promotionalPrice: varItem.promotionalPrice || null,
              costPrice: varItem.costPrice || null,
              isDefault: varItem.isDefault || k === 0,
              status: varItem.status || 'active',
              position: k,
            },
          })

          // Connect variation option values
          if (varItem.optionValues) {
            for (const [optName, valName] of Object.entries(varItem.optionValues)) {
              const optionValueId = optionValueMap.get(`${optName}:${valName}`)
              if (optionValueId) {
                await tx.productVariationValue.create({
                  data: {
                    variationId: createdVar.id,
                    optionValueId,
                  },
                })
              }
            }
          }
        }
      }

      // Link media files
      if (body.mediaFileIds && body.mediaFileIds.length > 0) {
        for (let idx = 0; idx < body.mediaFileIds.length; idx++) {
          const fileId = body.mediaFileIds[idx]
          if (!fileId) continue
          const isMain = body.mainMediaFileId ? fileId === body.mainMediaFileId : idx === 0
          await tx.productMedia.create({
            data: {
              productId: createdProduct.id,
              fileId,
              isMain,
              position: idx,
            },
          })
        }
      }

      return createdProduct
    })

    await logAudit({
      userId,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      newValues: { name: product.name, slug: product.slug, storeId: product.storeId, type: product.type },
      req,
    })

    return this.getProduct(product.id)
  }

  /**
   * Update existing Product
   */
  static async updateProduct(
    id: string,
    body: UpdateProductBody,
    userId: string,
    req?: FastifyRequest
  ) {
    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Produto não encontrado', 404)
    }

    const payload: any = {
      updatedBy: userId,
    }

    if (body.name !== undefined) payload.name = body.name
    if (body.shortDescription !== undefined) payload.shortDescription = body.shortDescription
    if (body.fullDescription !== undefined) payload.fullDescription = body.fullDescription
    if (body.status !== undefined) payload.status = body.status
    if (body.isPublished !== undefined) payload.isPublished = body.isPublished
    if (body.isFeatured !== undefined) payload.isFeatured = body.isFeatured
    if (body.categoryId !== undefined) payload.categoryId = body.categoryId
    if (body.brandId !== undefined) payload.brandId = body.brandId
    if (body.weight !== undefined) payload.weight = body.weight
    if (body.width !== undefined) payload.width = body.width
    if (body.height !== undefined) payload.height = body.height
    if (body.length !== undefined) payload.length = body.length

    if (body.slug !== undefined) {
      const finalSlug = slugify(body.slug)
      if (finalSlug !== existing.slug) {
        const slugExists = await prisma.product.findUnique({
          where: {
            storeId_slug: {
              storeId: existing.storeId,
              slug: finalSlug,
            },
          },
        })
        if (slugExists && slugExists.id !== id && !slugExists.deletedAt) {
          throw new AppError(
            'VALIDATION_ERROR',
            `Já existe um produto com o slug "${finalSlug}" nesta loja`,
            400
          )
        }
        payload.slug = finalSlug
      }
    }

    await prisma.product.update({
      where: { id },
      data: payload,
    })

    // If updating simple product price or SKU
    if (existing.type === 'simple' && (body.price !== undefined || body.sku !== undefined)) {
      const defaultVar = await prisma.productVariation.findFirst({
        where: { productId: id, isDefault: true },
      })
      if (defaultVar) {
        await prisma.productVariation.update({
          where: { id: defaultVar.id },
          data: {
            ...(body.price !== undefined ? { price: body.price } : {}),
            ...(body.promotionalPrice !== undefined ? { promotionalPrice: body.promotionalPrice } : {}),
            ...(body.costPrice !== undefined ? { costPrice: body.costPrice } : {}),
            ...(body.sku !== undefined ? { sku: body.sku } : {}),
          },
        })
      }
    }

    await logAudit({
      userId,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: id,
      oldValues: { name: existing.name, status: existing.status, isPublished: existing.isPublished },
      newValues: payload,
      req,
    })

    return this.getProduct(id)
  }

  /**
   * Publish product to Marketplace after validating mandatory readiness criteria
   */
  static async publishProduct(
    id: string,
    userId: string,
    req?: FastifyRequest
  ) {
    const product = await this.getProduct(id)

    // Readiness Validation Rules:
    // 1. Store active
    if (product.store.status !== 'active') {
      throw new AppError(
        'VALIDATION_ERROR',
        'Não é possível publicar o produto pois a loja vinculada está inativa ou em rascunho',
        400
      )
    }

    // 2. Product active
    if (product.status !== 'active') {
      throw new AppError(
        'VALIDATION_ERROR',
        'Ative o cadastro do produto (status: active) antes de publicá-lo no Marketplace',
        400
      )
    }

    // 3. At least 1 active variation with price > 0
    const activeVariations = product.variations.filter(
      (v) => v.status === 'active' && Number(v.price) > 0
    )
    if (activeVariations.length === 0) {
      throw new AppError(
        'VALIDATION_ERROR',
        'O produto deve ter pelo menos 1 variação ativa com preço de venda maior que zero para ser publicado',
        400
      )
    }

    await prisma.product.update({
      where: { id },
      data: {
        isPublished: true,
        updatedBy: userId,
      },
    })

    await logAudit({
      userId,
      action: 'PUBLISH_PRODUCT',
      entity: 'Product',
      entityId: id,
      newValues: { isPublished: true },
      req,
    })

    return this.getProduct(id)
  }

  /**
   * Soft-delete (archive) Product
   */
  static async archiveProduct(
    id: string,
    userId: string,
    req?: FastifyRequest
  ) {
    const existing = await prisma.product.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Produto não encontrado', 404)
    }

    await prisma.product.update({
      where: { id },
      data: {
        status: 'archived',
        isPublished: false,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    })

    await logAudit({
      userId,
      action: 'ARCHIVE_PRODUCT',
      entity: 'Product',
      entityId: id,
      oldValues: { name: existing.name, status: existing.status },
      req,
    })

    return { message: 'Produto arquivado com sucesso' }
  }
}
