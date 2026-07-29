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
    description: "Excluir/Arquivar produtos",
  },
  {
    key: "products.publish",
    module: "products",
    description: "Publicar produtos no Marketplace",
  },
  {
    key: "products.manage-media",
    module: "products",
    description: "Gerenciar imagens e mídias do produto",
  },
  {
    key: "products.manage-price",
    module: "products",
    description: "Gerenciar preços e custos de produtos",
  },

  // Files module
  {
    key: "files.read",
    module: "files",
    description: "Visualizar mídias e arquivos",
  },
  {
    key: "files.create",
    module: "files",
    description: "Fazer upload de arquivos",
  },

  // Lots module
  {
    key: "lots.read",
    module: "lots",
    description: "Visualizar lotes e validade de produtos",
  },
  { key: "lots.create", module: "lots", description: "Cadastrar novos lotes" },
  { key: "lots.update", module: "lots", description: "Editar dados do lote" },
  {
    key: "lots.quarantine",
    module: "lots",
    description: "Colocar ou liberar lotes da quarentena",
  },
  {
    key: "lots.block",
    module: "lots",
    description: "Bloquear ou desbloquear lotes",
  },
  {
    key: "lots.recall",
    module: "lots",
    description: "Executar ou gerenciar recolhimento (recall) de lotes",
  },

  // Stock module
  {
    key: "stock.read",
    module: "stock",
    description: "Visualizar estoque, FEFO e movimentações",
  },
  {
    key: "stock.receive",
    module: "stock",
    description: "Registrar recebimento de mercadorias por lote",
  },
  {
    key: "stock.transfer",
    module: "stock",
    description: "Transferir lotes entre localizações",
  },
  {
    key: "stock.adjust",
    module: "stock",
    description: "Realizar ajustes manuais de inventário",
  },
  {
    key: "stock.discard",
    module: "stock",
    description: "Realizar descarte formal por vencimento ou dano",
  },
  {
    key: "files.delete",
    module: "files",
    description: "Excluir mídias e arquivos",
  },

  // Audit logs module
  {
    key: "audit.read",
    module: "audit",
    description: "Visualizar logs de auditoria do sistema",
  },
  {
    key: "audit.export",
    module: "audit",
    description: "Exportar relatórios de auditoria",
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Seed Permissions
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }
  console.log(`✅ ${permissionsData.length} permissions seeded.`);

  // 2. Seed System Roles
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

  console.log("✅ 5 roles seeded.");

  // 3. Link all permissions to Admin Role
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

  // Link basic permissions to Employee & Supplier
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
  console.log("✅ Role permissions seeded.");

  // 4. Seed Management Users
  const defaultPasswordHash = await hashPassword("SenhaSegura123!");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@verttexloja.com.br" },
    update: {},
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
    update: {},
    create: {
      name: "Operador de Estoque",
      email: "operador@verttexloja.com.br",
      passwordHash: defaultPasswordHash,
      roleId: employeeRole.id,
      status: "active",
      emailVerifiedAt: new Date(),
    },
  });

  console.log("✅ Management users seeded.");

  // 5. Seed Stores
  const storeAlvorada = await prisma.store.upsert({
    where: { slug: "queijaria-alvorada" },
    update: {
      logoUrl:
        "https://images.unsplash.com/photo-1596450514735-2440b6165e31?auto=format&fit=crop&w=400&q=80",
    },
    create: {
      name: "Queijaria Alvorada Canastra",
      slug: "queijaria-alvorada",
      description: "Produtor tradicional de queijos artesanais da Canastra",
      logoUrl:
        "https://images.unsplash.com/photo-1596450514735-2440b6165e31?auto=format&fit=crop&w=400&q=80",
      status: "active",
    },
  });

  const storeMel = await prisma.store.upsert({
    where: { slug: "apiario-serra-verde" },
    update: {},
    create: {
      name: "Apiário Serra Verde",
      slug: "apiario-serra-verde",
      description: "Mel silvestre orgânico e derivados das montanhas de Minas",
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

  console.log("✅ Stores seeded.");

  // 6. Seed Categories & Brands
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

  // 7. Seed Sample Products with Batch & Expiration Control
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
      defaultShelfLifeDays: 180,
      minReceivingShelfLifeDays: 60,
      minDeliveryShelfLifeDays: 15,
      warningShelfLifeDays: 30,
    },
  });

  const varQueijo = await prisma.productVariation.upsert({
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
      defaultShelfLifeDays: 365,
      minReceivingShelfLifeDays: 90,
      minDeliveryShelfLifeDays: 30,
      warningShelfLifeDays: 45,
    },
  });

  const varMel = await prisma.productVariation.upsert({
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

  console.log("✅ Categorias, marcas e produtos de amostra semeadas.");

  // 8. Seed Inventory Locations
  const locAlvorada = await prisma.inventoryLocation.upsert({
    where: {
      storeId_code: {
        storeId: storeAlvorada.id,
        code: "DEP-01",
      },
    },
    update: {},
    create: {
      storeId: storeAlvorada.id,
      name: "Depósito Principal - Câmara Fria",
      code: "DEP-01",
      isDefault: true,
      status: "active",
    },
  });

  const locMel = await prisma.inventoryLocation.upsert({
    where: {
      storeId_code: {
        storeId: storeMel.id,
        code: "DEP-01",
      },
    },
    update: {},
    create: {
      storeId: storeMel.id,
      name: "Armazém Apiário Central",
      code: "DEP-01",
      isDefault: true,
      status: "active",
    },
  });

  // 9. Seed Sample Product Lots with Expiration Cases
  const now = new Date();

  // Case 1: Lote Válido (Validade em +150 dias)
  const expValid = new Date();
  expValid.setDate(now.getDate() + 150);

  const lotValid = await prisma.productLot.upsert({
    where: {
      storeId_productId_variationId_lotNumber: {
        storeId: storeAlvorada.id,
        productId: prodQueijo.id,
        variationId: varQueijo.id,
        lotNumber: "L-2026-CAN-01",
      },
    },
    update: {},
    create: {
      storeId: storeAlvorada.id,
      productId: prodQueijo.id,
      variationId: varQueijo.id,
      lotNumber: "L-2026-CAN-01",
      manufacturer: "Queijaria Serra da Canastra LTDA",
      supplier: "Cooperativa de Laticínios Canastra",
      manufacturingDate: new Date("2026-01-10"),
      expirationDate: expValid,
      status: "available",
      notes: "Armazenar refrigerado entre 4°C e 8°C",
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });

  // Case 2: Lote Próximo do Vencimento (Validade em +18 dias - Alerta)
  const expWarning = new Date();
  expWarning.setDate(now.getDate() + 18);

  const lotWarning = await prisma.productLot.upsert({
    where: {
      storeId_productId_variationId_lotNumber: {
        storeId: storeAlvorada.id,
        productId: prodQueijo.id,
        variationId: varQueijo.id,
        lotNumber: "L-2026-CAN-02",
      },
    },
    update: {},
    create: {
      storeId: storeAlvorada.id,
      productId: prodQueijo.id,
      variationId: varQueijo.id,
      lotNumber: "L-2026-CAN-02",
      manufacturer: "Queijaria Serra da Canastra LTDA",
      supplier: "Cooperativa de Laticínios Canastra",
      manufacturingDate: new Date("2025-11-01"),
      expirationDate: expWarning,
      status: "available",
      notes: "Lote com prioridade FEFO de saída por proximidade de vencimento",
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });

  // Case 3: Lote Vencido (Validade vencida há -6 dias - Requer descarte)
  const expExpired = new Date();
  expExpired.setDate(now.getDate() - 6);

  const lotExpired = await prisma.productLot.upsert({
    where: {
      storeId_productId_variationId_lotNumber: {
        storeId: storeAlvorada.id,
        productId: prodQueijo.id,
        variationId: varQueijo.id,
        lotNumber: "L-2026-CAN-03",
      },
    },
    update: {},
    create: {
      storeId: storeAlvorada.id,
      productId: prodQueijo.id,
      variationId: varQueijo.id,
      lotNumber: "L-2026-CAN-03",
      manufacturer: "Queijaria Serra da Canastra LTDA",
      supplier: "Cooperativa de Laticínios Canastra",
      manufacturingDate: new Date("2025-08-01"),
      expirationDate: expExpired,
      status: "available",
      notes:
        "Lote vencido aguardando baixa e descarte com empresa terceirizada",
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });

  // Case 4: Lote em Quarentena (Apiário Mel)
  const expQuarantine = new Date();
  expQuarantine.setDate(now.getDate() + 200);

  const lotQuarantine = await prisma.productLot.upsert({
    where: {
      storeId_productId_variationId_lotNumber: {
        storeId: storeMel.id,
        productId: prodMel.id,
        variationId: varMel.id,
        lotNumber: "L-2026-MEL-01",
      },
    },
    update: {},
    create: {
      storeId: storeMel.id,
      productId: prodMel.id,
      variationId: varMel.id,
      lotNumber: "L-2026-MEL-01",
      manufacturer: "Apiário Serra Verde",
      supplier: "Produtor Direto",
      manufacturingDate: new Date("2026-02-01"),
      expirationDate: expQuarantine,
      status: "quarantine",
      notes: "Em quarentena para análise laboratorial de cristalização",
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });

  // 10. Seed Stock Items & Initial Movements
  const stockItemsData = [
    {
      lot: lotValid,
      qty: 60,
      res: 5,
      varId: varQueijo.id,
      storeId: storeAlvorada.id,
      locId: locAlvorada.id,
    },
    {
      lot: lotWarning,
      qty: 25,
      res: 0,
      varId: varQueijo.id,
      storeId: storeAlvorada.id,
      locId: locAlvorada.id,
    },
    {
      lot: lotExpired,
      qty: 12,
      res: 0,
      varId: varQueijo.id,
      storeId: storeAlvorada.id,
      locId: locAlvorada.id,
    },
    {
      lot: lotQuarantine,
      qty: 40,
      res: 0,
      varId: varMel.id,
      storeId: storeMel.id,
      locId: locMel.id,
    },
  ];

  for (const item of stockItemsData) {
    await prisma.stockItem.upsert({
      where: {
        storeId_variationId_lotId_locationId: {
          storeId: item.storeId,
          variationId: item.varId,
          lotId: item.lot.id,
          locationId: item.locId,
        },
      },
      update: {
        physicalQuantity: item.qty,
        reservedQuantity: item.res,
      },
      create: {
        storeId: item.storeId,
        variationId: item.varId,
        lotId: item.lot.id,
        locationId: item.locId,
        physicalQuantity: item.qty,
        reservedQuantity: item.res,
      },
    });

    await prisma.stockMovement.create({
      data: {
        storeId: item.storeId,
        variationId: item.varId,
        lotId: item.lot.id,
        targetLocationId: item.locId,
        type: "RECEIVING",
        quantity: item.qty,
        reason: `Recebimento inicial semeado para lote ${item.lot.lotNumber}`,
        userId: adminUser.id,
      },
    });
  }

  console.log(
    "✅ Lotes de amostra, saldos de estoque e movimentações semeados com sucesso.",
  );

  // 11. Seed Customers & Addresses
  const customer1 = await prisma.customer.upsert({
    where: { email: "carlos@exemplo.com.br" },
    update: {},
    create: {
      name: "Carlos Eduardo Silva",
      email: "carlos@exemplo.com.br",
      cpfCnpj: "123.456.789-00",
      passwordHash: defaultPasswordHash,
      status: "active",
    },
  });

  const address1 = await prisma.customerAddress.create({
    data: {
      customerId: customer1.id,
      label: "Casa",
      recipient: "Carlos Eduardo Silva",
      street: "Rua da Canastra",
      number: "100",
      neighborhood: "Centro",
      city: "Passos",
      state: "MG",
      zipCode: "37900-000",
      isDefault: true,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: "ana@exemplo.com.br" },
    update: {},
    create: {
      name: "Ana Maria Fernandes",
      email: "ana@exemplo.com.br",
      cpfCnpj: "987.654.321-11",
      passwordHash: defaultPasswordHash,
      status: "active",
    },
  });

  const address2 = await prisma.customerAddress.create({
    data: {
      customerId: customer2.id,
      label: "Trabalho",
      recipient: "Ana Maria Fernandes",
      street: "Av. dos Produtores",
      number: "500",
      neighborhood: "Savassi",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30100-000",
      isDefault: true,
    },
  });

  console.log("✅ Compradores e endereços de teste semeados.");

  // 12. Seed Sample Orders with Various Statuses for Test Plan
  const orderPaid = await prisma.order.upsert({
    where: { code: "VTX-9821" },
    update: {},
    create: {
      id: "ord-101",
      code: "VTX-9821",
      storeId: storeAlvorada.id,
      customerId: customer1.id,
      customerAddressId: address1.id,
      status: "PAID",
      subtotal: 89.8,
      shippingFee: 0,
      discount: 0,
      totalAmount: 89.8,
      paymentMethod: "pix",
      paymentStatus: "approved",
    },
  });

  const itemOrder1 = await prisma.orderItem.create({
    data: {
      orderId: orderPaid.id,
      productId: prodQueijo.id,
      variationId: varQueijo.id,
      productName: prodQueijo.name,
      variationName: "Padrão / 500g",
      sku: varQueijo.sku,
      price: 44.9,
      costPrice: 28.0,
      quantity: 2,
      subtotal: 89.8,
    },
  });

  await prisma.orderItemLot.create({
    data: {
      orderItemId: itemOrder1.id,
      lotId: lotWarning.id,
      quantity: 2,
    },
  });

  await prisma.stockReservation.create({
    data: {
      storeId: storeAlvorada.id,
      orderId: orderPaid.id,
      variationId: varQueijo.id,
      lotId: lotWarning.id,
      locationId: locAlvorada.id,
      reservedQuantity: 2,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const orderShipped = await prisma.order.upsert({
    where: { code: "VTX-9822" },
    update: {},
    create: {
      id: "ord-102",
      code: "VTX-9822",
      storeId: storeMel.id,
      customerId: customer2.id,
      customerAddressId: address2.id,
      status: "SHIPPED",
      subtotal: 104.7,
      shippingFee: 15.0,
      discount: 0,
      totalAmount: 119.7,
      paymentMethod: "credit_card",
      paymentStatus: "approved",
      notes: "Transportadora: VERTTEX Express | Rastreio: BR987654321BR",
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: orderShipped.id,
      productId: prodMel.id,
      variationId: varMel.id,
      productName: prodMel.name,
      variationName: "Padrão / 500g",
      sku: varMel.sku,
      price: 34.9,
      costPrice: 18.5,
      quantity: 3,
      subtotal: 104.7,
    },
  });

  const orderPending = await prisma.order.upsert({
    where: { code: "VTX-9823" },
    update: {},
    create: {
      id: "ord-103",
      code: "VTX-9823",
      storeId: storeAlvorada.id,
      customerId: customer1.id,
      customerAddressId: address1.id,
      status: "PENDING",
      subtotal: 44.9,
      shippingFee: 12.0,
      discount: 0,
      totalAmount: 56.9,
      paymentMethod: "pix",
      paymentStatus: "pending",
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: orderPending.id,
      productId: prodQueijo.id,
      variationId: varQueijo.id,
      productName: prodQueijo.name,
      variationName: "Padrão / 500g",
      sku: varQueijo.sku,
      price: 44.9,
      costPrice: 28.0,
      quantity: 1,
      subtotal: 44.9,
    },
  });

  const orderDelivered = await prisma.order.upsert({
    where: { code: "VTX-9824" },
    update: {},
    create: {
      id: "ord-104",
      code: "VTX-9824",
      storeId: storeMel.id,
      customerId: customer2.id,
      customerAddressId: address2.id,
      status: "DELIVERED",
      subtotal: 69.8,
      shippingFee: 10.0,
      discount: 0,
      totalAmount: 79.8,
      paymentMethod: "credit_card",
      paymentStatus: "approved",
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: orderDelivered.id,
      productId: prodMel.id,
      variationId: varMel.id,
      productName: prodMel.name,
      variationName: "Padrão / 500g",
      sku: varMel.sku,
      price: 34.9,
      costPrice: 18.5,
      quantity: 2,
      subtotal: 69.8,
    },
  });

  const orderCancelled = await prisma.order.upsert({
    where: { code: "VTX-9825" },
    update: {},
    create: {
      id: "ord-105",
      code: "VTX-9825",
      storeId: storeAlvorada.id,
      customerId: customer1.id,
      customerAddressId: address1.id,
      status: "CANCELLED",
      subtotal: 44.9,
      shippingFee: 0,
      discount: 0,
      totalAmount: 44.9,
      paymentMethod: "boleto",
      paymentStatus: "failed",
      cancelReason: "Desistência do comprador no ato do pagamento",
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: orderCancelled.id,
      productId: prodQueijo.id,
      variationId: varQueijo.id,
      productName: prodQueijo.name,
      variationName: "Padrão / 500g",
      sku: varQueijo.sku,
      price: 44.9,
      costPrice: 28.0,
      quantity: 1,
      subtotal: 44.9,
    },
  });

  console.log("✅ Pedidos de teste semeados com múltiplos status (PAID, SHIPPED, PENDING, DELIVERED, CANCELLED).");

  // 13. Seed Sanitary Discard Stock Movements (For Losses & Curva ABC Reports)
  await prisma.stockMovement.create({
    data: {
      storeId: storeAlvorada.id,
      variationId: varQueijo.id,
      lotId: lotExpired.id,
      sourceLocationId: locAlvorada.id,
      type: "EXPIRATION_DISCARD",
      quantity: 12,
      reason: "Descarte sanitário formal por vencimento do lote L-2026-CAN-03",
      userId: adminUser.id,
    },
  });

  await prisma.stockMovement.create({
    data: {
      storeId: storeAlvorada.id,
      variationId: varQueijo.id,
      lotId: lotValid.id,
      sourceLocationId: locAlvorada.id,
      type: "DAMAGE_DISCARD",
      quantity: 3,
      reason: "Descarte por avaria na embalagem durante movimentação interna",
      userId: adminUser.id,
    },
  });

  console.log("✅ Movimentações de perda sanitária registradas.");

  // 14. Seed Audit Logs
  const auditLogsData = [
    {
      userId: adminUser.id,
      action: "USER_LOGIN",
      entity: "User",
      entityId: adminUser.id,
      newValues: { status: "success", role: "admin", ip: "127.0.0.1" },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
    {
      userId: adminUser.id,
      action: "ORDER_CHECKOUT",
      entity: "Order",
      entityId: orderPaid.id,
      newValues: { code: orderPaid.code, totalAmount: 89.8, itemsCount: 2 },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
    {
      userId: adminUser.id,
      action: "ORDER_DISPATCH",
      entity: "Order",
      entityId: orderShipped.id,
      oldValues: { status: "PAID" },
      newValues: { status: "SHIPPED", trackingCode: "BR987654321BR" },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
    {
      userId: adminUser.id,
      action: "LOT_QUARANTINE_ENTRY",
      entity: "ProductLot",
      entityId: lotQuarantine.id,
      oldValues: { status: "available" },
      newValues: { status: "quarantine", notes: "Análise laboratorial de cristalização" },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
    {
      userId: adminUser.id,
      action: "REPORT_EXPORT",
      entity: "Report",
      newValues: { format: "csv", reportType: "abc_curve" },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({
      data: log,
    });
  }

  console.log("✅ Logs de auditoria inicializados.");

  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
