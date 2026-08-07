import '@verttex/env/api'

import type { PrismaClient } from '@prisma/client'

import { assertSafeLocalDatabaseUrl } from '../src/shared/utils/db-guard.js'

const permissionsData = [
  // Users module
  {
    key: 'users.read',
    module: 'users',
    description: 'Visualizar lista e detalhes de usuários',
  },
  {
    key: 'users.create',
    module: 'users',
    description: 'Cadastrar novos usuários gestores',
  },
  {
    key: 'users.update',
    module: 'users',
    description: 'Editar dados de usuários',
  },
  { key: 'users.delete', module: 'users', description: 'Desativar usuários' },

  // Roles module
  { key: 'roles.read', module: 'roles', description: 'Visualizar cargos' },
  { key: 'roles.create', module: 'roles', description: 'Criar novos cargos' },
  { key: 'roles.update', module: 'roles', description: 'Editar cargos' },
  {
    key: 'roles.delete',
    module: 'roles',
    description: 'Excluir cargos não-sistema',
  },

  // Permissions module
  {
    key: 'permissions.read',
    module: 'permissions',
    description: 'Visualizar permissões',
  },
  {
    key: 'permissions.manage',
    module: 'permissions',
    description: 'Gerenciar permissões de cargos e usuários',
  },

  // Stores module
  { key: 'stores.read', module: 'stores', description: 'Visualizar lojas' },
  { key: 'stores.create', module: 'stores', description: 'Criar novas lojas' },
  {
    key: 'stores.update',
    module: 'stores',
    description: 'Editar dados da loja',
  },
  { key: 'stores.delete', module: 'stores', description: 'Desativar loja' },
  {
    key: 'stores.manage-members',
    module: 'stores',
    description: 'Vincular e desvincular usuários da loja',
  },

  // Categories module
  {
    key: 'categories.read',
    module: 'categories',
    description: 'Visualizar categorias',
  },
  {
    key: 'categories.create',
    module: 'categories',
    description: 'Criar categorias',
  },
  {
    key: 'categories.update',
    module: 'categories',
    description: 'Editar categorias',
  },
  {
    key: 'categories.delete',
    module: 'categories',
    description: 'Arquivar categorias',
  },

  // Brands module
  { key: 'brands.read', module: 'brands', description: 'Visualizar marcas' },
  { key: 'brands.create', module: 'brands', description: 'Criar marcas' },
  { key: 'brands.update', module: 'brands', description: 'Editar marcas' },
  { key: 'brands.delete', module: 'brands', description: 'Arquivar marcas' },

  // Products module
  {
    key: 'products.read',
    module: 'products',
    description: 'Visualizar produtos',
  },
  {
    key: 'products.create',
    module: 'products',
    description: 'Cadastrar produtos',
  },
  {
    key: 'products.update',
    module: 'products',
    description: 'Editar produtos',
  },
  {
    key: 'products.delete',
    module: 'products',
    description: 'Excluir/Arquivar produtos',
  },
  {
    key: 'products.publish',
    module: 'products',
    description: 'Publicar produtos no Marketplace',
  },
  {
    key: 'products.manage-media',
    module: 'products',
    description: 'Gerenciar imagens e mídias do produto',
  },
  {
    key: 'products.manage-price',
    module: 'products',
    description: 'Gerenciar preços e custos de produtos',
  },

  // Files module
  {
    key: 'files.read',
    module: 'files',
    description: 'Visualizar mídias e arquivos',
  },
  {
    key: 'files.create',
    module: 'files',
    description: 'Fazer upload de arquivos',
  },
  {
    key: 'files.delete',
    module: 'files',
    description: 'Excluir mídias e arquivos',
  },

  // Lots module
  {
    key: 'lots.read',
    module: 'lots',
    description: 'Visualizar lotes e validade de produtos',
  },
  { key: 'lots.create', module: 'lots', description: 'Cadastrar novos lotes' },
  { key: 'lots.update', module: 'lots', description: 'Editar dados do lote' },
  {
    key: 'lots.quarantine',
    module: 'lots',
    description: 'Colocar ou liberar lotes da quarentena',
  },
  {
    key: 'lots.block',
    module: 'lots',
    description: 'Bloquear ou desbloquear lotes',
  },
  {
    key: 'lots.recall',
    module: 'lots',
    description: 'Executar ou gerenciar recolhimento (recall) de lotes',
  },

  // Stock module
  {
    key: 'stock.read',
    module: 'stock',
    description: 'Visualizar estoque, FEFO e movimentações',
  },
  {
    key: 'stock.receive',
    module: 'stock',
    description: 'Registrar recebimento de mercadorias por lote',
  },
  {
    key: 'stock.transfer',
    module: 'stock',
    description: 'Transferir lotes entre localizações',
  },
  {
    key: 'stock.adjust',
    module: 'stock',
    description: 'Realizar ajustes manuais de inventário',
  },
  {
    key: 'stock.discard',
    module: 'stock',
    description: 'Realizar descarte formal por vencimento ou dano',
  },

  // Audit logs module
  {
    key: 'audit.read',
    module: 'audit',
    description: 'Visualizar logs de auditoria do sistema',
  },
  {
    key: 'audit.export',
    module: 'audit',
    description: 'Exportar relatórios de auditoria',
  },
]

export type PrismaClientFactory = () => Promise<Record<string, unknown>>

export async function defaultPrismaClientFactory() {
  const { prisma } = await import('../src/infrastructure/database/prisma.js')
  return prisma as unknown as Record<string, unknown>
}

export async function cleanDatabase(options?: {
  prismaClientFactory?: PrismaClientFactory
}) {
  // 1. Validate DATABASE_URL BEFORE instantiating Prisma or connecting
  assertSafeLocalDatabaseUrl()

  // 2. Dynamically import Prisma and dependencies ONLY AFTER guard validation passes
  const getPrisma = options?.prismaClientFactory ?? defaultPrismaClientFactory
  const prisma = (await getPrisma()) as unknown as PrismaClient
  const { hashPassword } = await import('../src/shared/utils/crypto.js')
  const { clearReturnsStore } =
    await import('../src/modules/returns/returns.service.js')

  let cleanupError: unknown = null
  let disconnectError: unknown = null

  try {
    console.log('🧹 Limpando o banco de dados...')

    // Delete in reverse dependency order respecting FK constraints (no raw SQL)
    await prisma.stockMovement.deleteMany()
    await prisma.stockReservation.deleteMany()
    await prisma.orderItemLot.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.cartCoupon.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.coupon.deleteMany()
    await prisma.stockTransfer.deleteMany()
    await prisma.stockItem.deleteMany()
    await prisma.inventoryLocation.deleteMany()
    await prisma.productLot.deleteMany()
    await prisma.productSearchDocument.deleteMany()
    await prisma.productVariationValue.deleteMany()
    await prisma.productVariation.deleteMany()
    await prisma.productMedia.deleteMany()
    await prisma.product.deleteMany()
    await prisma.productOptionValue.deleteMany()
    await prisma.productOption.deleteMany()
    await prisma.personalizationProfile.deleteMany()
    await prisma.customerSession.deleteMany()
    await prisma.customerPasswordResetToken.deleteMany()
    await prisma.customerAddress.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.storeUser.deleteMany()
    await prisma.carouselBanner.deleteMany()
    await prisma.marketplaceSettings.deleteMany()
    await prisma.file.deleteMany()
    await prisma.brand.deleteMany()
    await prisma.category.deleteMany()
    await prisma.store.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.revokedToken.deleteMany()
    await prisma.userPasswordResetToken.deleteMany()
    await prisma.userPermission.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.user.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.role.deleteMany()

    // Limpa o registro em memória de devoluções/trocas
    clearReturnsStore()

    console.log(
      '✨ Banco de dados e armazenamento de devoluções limpos com sucesso!',
    )

    console.log('🔑 Semeando permissões do sistema...')
    const createdPermissions = await Promise.all(
      permissionsData.map((perm) =>
        prisma.permission.create({
          data: perm,
        }),
      ),
    )

    console.log('🛡️ Criando cargos essenciais do sistema...')
    const adminRole = await prisma.role.create({
      data: {
        name: 'Administrador Global',
        key: 'admin',
        description:
          'Acesso total a todas as funcionalidades e configurações do ecossistema',
        isSystem: true,
      },
    })

    await prisma.role.createMany({
      data: [
        {
          name: 'Operador de Logística & Estoque',
          key: 'employee',
          description:
            'Controle de recebimento, movimentações FEFO e quarentena sanitária',
          isSystem: true,
        },
        {
          name: 'Produtor / Fornecedor Parceiro',
          key: 'supplier',
          description:
            'Gestão do catálogo próprio, estoques da loja e remessas',
          isSystem: true,
        },
        {
          name: 'Gerente de Loja',
          key: 'store_manager',
          description:
            'Gestão operacional e financeira de uma loja parceira específica',
          isSystem: true,
        },
        {
          name: 'Auditor Sanitário',
          key: 'auditor',
          description:
            'Acesso de leitura e exportação para fiscalização sanitária e compliance',
          isSystem: true,
        },
      ],
    })

    console.log('🔗 Vinculando todas as permissões ao cargo Admin...')
    await prisma.rolePermission.createMany({
      data: createdPermissions.map((perm) => ({
        roleId: adminRole.id,
        permissionId: perm.id,
      })),
    })

    console.log('👤 Criando usuário Administrador único...')
    const adminPasswordHash = await hashPassword('admin123')

    const adminUser = await prisma.user.create({
      data: {
        name: 'Administrador Verttex',
        email: 'admin@verttexloja.com.br',
        passwordHash: adminPasswordHash,
        roleId: adminRole.id,
        status: 'active',
      },
    })

    console.log('👤 Único Usuário Registrado:')
    console.log(`- Nome:  ${adminUser.name}`)
    console.log(`- Email: ${adminUser.email}`)
    console.log('- Senha: admin123')
    console.log(`- Cargo: ${adminRole.name} (${adminRole.key})`)
  } catch (err) {
    cleanupError = err
  } finally {
    try {
      if (prisma && typeof prisma.$disconnect === 'function') {
        await prisma.$disconnect()
      }
    } catch (disconnectErr) {
      if (cleanupError) {
        console.error('Falha adicional ao encerrar a conexão.')
      } else {
        disconnectError = disconnectErr
      }
    }
  }

  if (cleanupError) {
    throw cleanupError
  }

  if (disconnectError) {
    throw disconnectError
  }
}

// Only auto-execute when invoked directly via CLI (e.g., pnpm db:clean)
if (
  process.argv[1] &&
  (process.argv[1].endsWith('clean.ts') || process.argv[1].endsWith('clean.js'))
) {
  cleanDatabase().catch(() => {
    console.error('Falha ao executar a limpeza do banco.')
    process.exit(1)
  })
}
