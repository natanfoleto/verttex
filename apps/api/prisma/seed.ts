import { prisma } from "../src/infrastructure/database/prisma.js";
import { hashPassword } from "../src/shared/utils/crypto.js";

const permissionsData = [
  // Users module
  {
    key: "users.read",
    module: "users",
    description: "Visualizar lista e detalhes de usuários",
  },
  {
    key: "users.create",
    module: "users",
    description: "Cadastrar novos usuários gestores",
  },
  {
    key: "users.update",
    module: "users",
    description: "Editar dados de usuários",
  },
  { key: "users.delete", module: "users", description: "Desativar usuários" },

  // Roles module
  { key: "roles.read", module: "roles", description: "Visualizar cargos" },
  { key: "roles.create", module: "roles", description: "Criar novos cargos" },
  { key: "roles.update", module: "roles", description: "Editar cargos" },
  {
    key: "roles.delete",
    module: "roles",
    description: "Excluir cargos não-sistema",
  },

  // Permissions module
  {
    key: "permissions.read",
    module: "permissions",
    description: "Visualizar permissões",
  },
  {
    key: "permissions.manage",
    module: "permissions",
    description: "Gerenciar permissões de cargos e usuários",
  },

  // Stores module
  { key: "stores.read", module: "stores", description: "Visualizar lojas" },
  { key: "stores.create", module: "stores", description: "Criar novas lojas" },
  {
    key: "stores.update",
    module: "stores",
    description: "Editar dados da loja",
  },
  { key: "stores.delete", module: "stores", description: "Desativar loja" },
  {
    key: "stores.manage-members",
    module: "stores",
    description: "Vincular e desvincular usuários da loja",
  },

  // Categories module
  {
    key: "categories.read",
    module: "categories",
    description: "Visualizar categorias",
  },
  {
    key: "categories.create",
    module: "categories",
    description: "Criar categorias",
  },
  {
    key: "categories.update",
    module: "categories",
    description: "Editar categorias",
  },
  {
    key: "categories.delete",
    module: "categories",
    description: "Arquivar categorias",
  },

  // Brands module
  { key: "brands.read", module: "brands", description: "Visualizar marcas" },
  { key: "brands.create", module: "brands", description: "Criar marcas" },
  { key: "brands.update", module: "brands", description: "Editar marcas" },
  { key: "brands.delete", module: "brands", description: "Arquivar marcas" },

  // Products module
  {
    key: "products.read",
    module: "products",
    description: "Visualizar produtos",
  },
  {
    key: "products.create",
    module: "products",
    description: "Cadastrar produtos",
  },
  {
    key: "products.update",
    module: "products",
    description: "Editar produtos",
  },
  {
    key: "products.delete",
    module: "products",
    description: "Desativar produtos",
  },

  // Files module
  { key: "files.read", module: "files", description: "Visualizar arquivos" },
  { key: "files.create", module: "files", description: "Fazer upload de arquivos" },
  { key: "files.delete", module: "files", description: "Remover arquivos" },

  // Lots module
  { key: "lots.read", module: "lots", description: "Visualizar lotes de produtos" },
  { key: "lots.create", module: "lots", description: "Cadastrar novos lotes" },
  { key: "lots.update", module: "lots", description: "Editar dados de lotes" },
  { key: "lots.quarantine", module: "lots", description: "Colocar ou remover lotes de quarentena" },

  // Stock module
  { key: "stock.read", module: "stock", description: "Visualizar estoque e posições" },
  { key: "stock.receive", module: "stock", description: "Dar entrada física de mercadorias" },
  { key: "stock.adjust", module: "stock", description: "Realizar ajustes de inventário" },
  { key: "stock.transfer", module: "stock", description: "Transferir estoque entre depósitos" },

  // Inventory Locations module
  { key: "locations.read", module: "locations", description: "Visualizar depósitos" },
  { key: "locations.create", module: "locations", description: "Cadastrar depósitos" },
  { key: "locations.update", module: "locations", description: "Editar depósitos" },

  // Orders module
  { key: "orders.read", module: "orders", description: "Visualizar pedidos" },
  { key: "orders.update-status", module: "orders", description: "Atualizar status de pedidos" },
  { key: "orders.cancel", module: "orders", description: "Cancelar pedidos" },

  // Reports module
  { key: "reports.read", module: "reports", description: "Visualizar relatórios" },
  { key: "reports.export", module: "reports", description: "Exportar relatórios em CSV" },

  // Audit module
  { key: "audit.read", module: "audit", description: "Visualizar histórico de auditoria" },
  { key: "audit.export", module: "audit", description: "Exportar relatórios de auditoria" },

  // Marketplace module
  { key: "marketplace.read", module: "marketplace", description: "Visualizar carrossel e configurações do marketplace" },
  { key: "marketplace.create", module: "marketplace", description: "Criar banners do carrossel" },
  { key: "marketplace.update", module: "marketplace", description: "Editar banners e configurações do marketplace" },
  { key: "marketplace.delete", module: "marketplace", description: "Excluir banners do carrossel" },
];

async function main() {
  console.log("🌱 Iniciando seed minimalista...");

  // 1. Permissões
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }
  console.log(`✅ ${permissionsData.length} permissões cadastradas.`);

  // 2. Cargos do Sistema
  const adminRole = await prisma.role.upsert({
    where: { key: "admin" },
    update: {},
    create: {
      key: "admin",
      name: "Administrador Global",
      description: "Acesso irrestrito a todos os módulos e lojas da plataforma",
      isSystem: true,
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { key: "employee" },
    update: {},
    create: {
      key: "employee",
      name: "Funcionário / Operador",
      description: "Acesso operacional às lojas vinculadas",
      isSystem: true,
    },
  });

  const supplierRole = await prisma.role.upsert({
    where: { key: "supplier" },
    update: {},
    create: {
      key: "supplier",
      name: "Produtor / Fornecedor Parceiro",
      description: "Gestão do catálogo, estoque e vendas de suas lojas",
      isSystem: true,
    },
  });

  await prisma.role.upsert({
    where: { key: "store_manager" },
    update: {},
    create: {
      key: "store_manager",
      name: "Gerente de Loja",
      description: "Administração completa da loja vinculada",
      isSystem: false,
    },
  });

  await prisma.role.upsert({
    where: { key: "auditor" },
    update: {},
    create: {
      key: "auditor",
      name: "Auditor de Conformidade",
      description: "Acesso somente-leitura aos relatórios e logs de auditoria",
      isSystem: false,
    },
  });

  console.log("✅ Cargos cadastrados.");

  // 3. Vincular Permissões
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  const employeePermKeys = [
    "users.read",
    "stores.read",
    "categories.read",
    "brands.read",
    "products.read",
    "products.create",
    "products.update",
    "files.read",
    "files.create",
    "lots.read",
    "lots.create",
    "lots.update",
    "stock.read",
    "stock.receive",
    "stock.adjust",
  ];
  for (const perm of allPermissions.filter((p) =>
    employeePermKeys.includes(p.key),
  )) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: employeeRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: employeeRole.id,
        permissionId: perm.id,
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: supplierRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: supplierRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log("✅ Permissões dos cargos cadastradas.");

  // 4. Usuários (Senha padrão: admin123)
  const defaultPasswordHash = await hashPassword("admin123");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@verttexloja.com.br" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: "Administrador Verttex",
      email: "admin@verttexloja.com.br",
      passwordHash: defaultPasswordHash,
      roleId: adminRole.id,
      status: "active",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "operador@verttexloja.com.br" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: "Operador de Estoque",
      email: "operador@verttexloja.com.br",
      passwordHash: defaultPasswordHash,
      roleId: employeeRole.id,
      status: "active",
      emailVerifiedAt: new Date(),
    },
  });

  console.log("✅ Usuários cadastrados (Senha padrão: admin123).");

  // 5. Lojas (sem fotos)
  const storeAlvorada = await prisma.store.upsert({
    where: { slug: "queijaria-alvorada" },
    update: { logoUrl: null, coverUrl: null },
    create: {
      name: "Queijaria Alvorada Canastra",
      slug: "queijaria-alvorada",
      description: "Produtor tradicional de queijos artesanais da Canastra",
      logoUrl: null,
      coverUrl: null,
      status: "active",
    },
  });

  const storeMel = await prisma.store.upsert({
    where: { slug: "apiario-serra-verde" },
    update: { logoUrl: null, coverUrl: null },
    create: {
      name: "Apiário Serra Verde",
      slug: "apiario-serra-verde",
      description: "Mel silvestre orgânico e derivados das montanhas de Minas",
      logoUrl: null,
      coverUrl: null,
      status: "active",
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_userId: {
        storeId: storeAlvorada.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      storeId: storeAlvorada.id,
      userId: adminUser.id,
      isOwner: true,
      isActive: true,
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_userId: {
        storeId: storeMel.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      storeId: storeMel.id,
      userId: adminUser.id,
      isOwner: true,
      isActive: true,
    },
  });

  console.log("✅ Lojas cadastradas (sem fotos).");

  // 6. Categorias & Marcas (sem fotos)
  const catQueijos = await prisma.category.upsert({
    where: { slug: "queijo-canastra" },
    update: {},
    create: {
      name: "Queijos Artesanais",
      slug: "queijo-canastra",
      description: "Queijos maturados com denominação de origem",
      status: "active",
      isVisible: true,
    },
  });

  const catMel = await prisma.category.upsert({
    where: { slug: "mel-e-doces" },
    update: {},
    create: {
      name: "Mel & Doces Artesanais",
      slug: "mel-e-doces",
      description: "Mel puro de florada silvestre e compotas tradicionais",
      status: "active",
      isVisible: true,
    },
  });

  const brandCanastra = await prisma.brand.upsert({
    where: { slug: "queijaria-serra-da-canastra" },
    update: {},
    create: {
      name: "Queijaria Serra da Canastra",
      slug: "queijaria-serra-da-canastra",
      description: "Produtor tradicional da Serra da Canastra",
      status: "active",
      isVisible: true,
    },
  });

  const brandApiario = await prisma.brand.upsert({
    where: { slug: "serra-verde-artesanal" },
    update: {},
    create: {
      name: "Serra Verde Artesanal",
      slug: "serra-verde-artesanal",
      description: "Produtos apícolas certificados",
      status: "active",
      isVisible: true,
    },
  });

  console.log("✅ Categorias e Marcas cadastradas.");

  // 7. Produtos (sem fotos)
  const prodQueijo = await prisma.product.upsert({
    where: {
      storeId_slug: {
        storeId: storeAlvorada.id,
        slug: "queijo-canastra-meia-cura-500g",
      },
    },
    update: {},
    create: {
      storeId: storeAlvorada.id,
      categoryId: catQueijos.id,
      brandId: brandCanastra.id,
      name: "Queijo Canastra Meia Cura 500g",
      slug: "queijo-canastra-meia-cura-500g",
      shortDescription: "Queijo artesanal da Canastra maturado por 14 dias",
      fullDescription:
        "Produzido com leite cru de vaca na região da Serra da Canastra.",
      type: "simple",
      status: "active",
      isPublished: true,
      isFeatured: true,
      weight: 500,
      hasBatchControl: true,
      hasExpirationControl: true,
      isExpirationRequired: true,
    },
  });

  await prisma.productVariation.upsert({
    where: {
      storeId_sku: {
        storeId: storeAlvorada.id,
        sku: "CANASTRA-MC-500G",
      },
    },
    update: {},
    create: {
      storeId: storeAlvorada.id,
      productId: prodQueijo.id,
      sku: "CANASTRA-MC-500G",
      price: 49.9,
      promotionalPrice: 44.9,
      costPrice: 28.0,
      isDefault: true,
      status: "active",
      weight: 500,
    },
  });

  const prodMel = await prisma.product.upsert({
    where: {
      storeId_slug: {
        storeId: storeMel.id,
        slug: "mel-silvestre-organico-500g",
      },
    },
    update: {},
    create: {
      storeId: storeMel.id,
      categoryId: catMel.id,
      brandId: brandApiario.id,
      name: "Mel Silvestre Orgânico 500g",
      slug: "mel-silvestre-organico-500g",
      shortDescription: "Mel 100% puro de florada nativa das serras de Minas",
      fullDescription:
        "Extratado a frio preservando todos os minerais e enzimas naturais.",
      type: "simple",
      status: "active",
      isPublished: true,
      isFeatured: true,
      weight: 500,
      hasBatchControl: true,
      hasExpirationControl: true,
      isExpirationRequired: true,
    },
  });

  await prisma.productVariation.upsert({
    where: {
      storeId_sku: {
        storeId: storeMel.id,
        sku: "MEL-SILVESTRE-500G",
      },
    },
    update: {},
    create: {
      storeId: storeMel.id,
      productId: prodMel.id,
      sku: "MEL-SILVESTRE-500G",
      price: 38.0,
      promotionalPrice: 34.9,
      costPrice: 18.5,
      isDefault: true,
      status: "active",
      weight: 500,
    },
  });

  console.log("✅ Produtos e Variações cadastrados (sem fotos).");

  // 8. Configurações Iniciais do Marketplace (sem fotos)
  await prisma.marketplaceSettings.deleteMany();
  await prisma.marketplaceSettings.create({
    data: {
      id: "default-settings",
      publicName: "VERTTEX Marketplace",
      announcementActive: true,
      announcementText: "🚚 Frete Grátis para compras acima de R$ 300,00 em todo o município!",
      supportEmail: "atendimento@verttex.com.br",
      supportPhone: "(11) 4003-8899",
      supportWhatsapp: "(11) 99887-7665",
      outOfStockBehavior: "show_badge",
      logoFileId: null,
      faviconFileId: null,
      ogImageFileId: null,
    },
  });

  console.log("✅ Configurações padrão do Marketplace cadastradas (sem fotos).");

  console.log("🎉 Seed minimalista concluída com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
