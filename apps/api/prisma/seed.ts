import { prisma } from "../src/infrastructure/database/prisma.js";
import { hashPassword } from "../src/shared/utils/crypto.js";
import { ProductSearchIndexService } from "../src/modules/catalog/product-search-index.service.js";
import { isValidGtin } from "../src/shared/utils/barcode-validator.js";

const permissionsData = [
  // Users module
  { key: "users.read", module: "users", description: "Visualizar lista e detalhes de usuários" },
  { key: "users.create", module: "users", description: "Cadastrar novos usuários gestores" },
  { key: "users.update", module: "users", description: "Editar dados de usuários" },
  { key: "users.delete", module: "users", description: "Desativar usuários" },

  // Roles module
  { key: "roles.read", module: "roles", description: "Visualizar cargos" },
  { key: "roles.create", module: "roles", description: "Criar novos cargos" },
  { key: "roles.update", module: "roles", description: "Editar cargos" },
  { key: "roles.delete", module: "roles", description: "Excluir cargos não-sistema" },

  // Permissions module
  { key: "permissions.read", module: "permissions", description: "Visualizar permissões" },
  { key: "permissions.manage", module: "permissions", description: "Gerenciar permissões de cargos e usuários" },

  // Stores module
  { key: "stores.read", module: "stores", description: "Visualizar lojas" },
  { key: "stores.create", module: "stores", description: "Criar novas lojas" },
  { key: "stores.update", module: "stores", description: "Editar dados da loja" },
  { key: "stores.delete", module: "stores", description: "Desativar loja" },
  { key: "stores.manage-members", module: "stores", description: "Vincular e desvincular usuários da loja" },

  // Categories module
  { key: "categories.read", module: "categories", description: "Visualizar categorias" },
  { key: "categories.create", module: "categories", description: "Criar categorias" },
  { key: "categories.update", module: "categories", description: "Editar categorias" },
  { key: "categories.delete", module: "categories", description: "Arquivar categorias" },

  // Brands module
  { key: "brands.read", module: "brands", description: "Visualizar marcas" },
  { key: "brands.create", module: "brands", description: "Criar marcas" },
  { key: "brands.update", module: "brands", description: "Editar marcas" },
  { key: "brands.delete", module: "brands", description: "Arquivar marcas" },

  // Products module
  { key: "products.read", module: "products", description: "Visualizar produtos" },
  { key: "products.create", module: "products", description: "Cadastrar produtos" },
  { key: "products.update", module: "products", description: "Editar produtos" },
  { key: "products.delete", module: "products", description: "Desativar produtos" },

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
  console.log("🌱 Iniciando seed rica e determinística para Product Discovery...");

  // 1. Permissões
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }
  console.log(`✅ ${permissionsData.length} permissões cadastradas.`);

  // 2. Cargos
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

  // 3. Vincular Permissões aos Cargos
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const employeePermKeys = [
    "users.read", "stores.read", "categories.read", "brands.read",
    "products.read", "products.create", "products.update", "files.read",
    "files.create", "lots.read", "lots.create", "lots.update",
    "stock.read", "stock.receive", "stock.adjust",
  ];
  for (const perm of allPermissions.filter((p) => employeePermKeys.includes(p.key))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: employeeRole.id, permissionId: perm.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: supplierRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: supplierRole.id, permissionId: perm.id },
    });
  }

  // 4. Usuários de Teste (Senha padrão: admin123)
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

  // 5. Lojas / Produtores
  const storeAlvorada = await prisma.store.upsert({
    where: { slug: "queijaria-alvorada" },
    update: { status: "active" },
    create: {
      name: "Queijaria Alvorada Canastra",
      slug: "queijaria-alvorada",
      description: "Produtor tradicional de queijos artesanais da Canastra",
      status: "active",
    },
  });

  const storeMel = await prisma.store.upsert({
    where: { slug: "apiario-serra-verde" },
    update: { status: "active" },
    create: {
      name: "Apiário Serra Verde",
      slug: "apiario-serra-verde",
      description: "Mel silvestre orgânico e derivados das montanhas de Minas",
      status: "active",
    },
  });

  const storeEngenho = await prisma.store.upsert({
    where: { slug: "engenho-boa-esperanca" },
    update: { status: "active" },
    create: {
      name: "Engenho Boa Esperança",
      slug: "engenho-boa-esperanca",
      description: "Cachaças artesanais envelhecidas em maderias nobres",
      status: "active",
    },
  });

  const storeDoces = await prisma.store.upsert({
    where: { slug: "doces-da-vovo" },
    update: { status: "active" },
    create: {
      name: "Doces da Vovó Artesanais",
      slug: "doces-da-vovo",
      description: "Doces de leite, goiabadas e compotas caseiras tradicionais",
      status: "active",
    },
  });

  const storeInativa = await prisma.store.upsert({
    where: { slug: "fazenda-inativa" },
    update: { status: "suspended" },
    create: {
      name: "Fazenda Inativa Demonstrativa",
      slug: "fazenda-inativa",
      description: "Loja desativada para testes de filtros de visibilidade pública",
      status: "suspended",
    },
  });

  const activeStores = [storeAlvorada, storeMel, storeEngenho, storeDoces, storeInativa];
  for (const s of activeStores) {
    await prisma.storeUser.upsert({
      where: { storeId_userId: { storeId: s.id, userId: adminUser.id } },
      update: {},
      create: { storeId: s.id, userId: adminUser.id, isOwner: true, isActive: true },
    });
  }

  // Depósitos Padrão (InventoryLocation) por Loja
  const storeLocations: Record<string, string> = {};
  for (const s of activeStores) {
    const loc = await prisma.inventoryLocation.upsert({
      where: { storeId_code: { storeId: s.id, code: "DEP-01" } },
      update: {},
      create: {
        storeId: s.id,
        name: `Depósito Principal - ${s.name}`,
        code: "DEP-01",
        isDefault: true,
        status: "active",
      },
    });
    storeLocations[s.id] = loc.id;
  }

  console.log("✅ Lojas e Depósitos cadastrados.");

  // 6. Categorias Hierárquicas
  const catAlimentos = await prisma.category.upsert({
    where: { slug: "alimentos" },
    update: {},
    create: {
      name: "Alimentos",
      slug: "alimentos",
      description: "Produtos alimentícios artesanais e locais",
      status: "active",
      isVisible: true,
    },
  });

  const catBebidas = await prisma.category.upsert({
    where: { slug: "bebidas" },
    update: {},
    create: {
      name: "Bebidas",
      slug: "bebidas",
      description: "Bebidas destiladas e fermentadas artesanais",
      status: "active",
      isVisible: true,
    },
  });

  const catMel = await prisma.category.upsert({
    where: { slug: "mel-e-derivados" },
    update: { parentId: catAlimentos.id },
    create: {
      name: "Mel e Derivados",
      slug: "mel-e-derivados",
      description: "Mel puro, própolis e favos in natura",
      parentId: catAlimentos.id,
      status: "active",
      isVisible: true,
    },
  });

  const catDoces = await prisma.category.upsert({
    where: { slug: "doces-artesanais" },
    update: { parentId: catAlimentos.id },
    create: {
      name: "Doces Artesanais",
      slug: "doces-artesanais",
      description: "Doces de leite, goiabada cascão e paçocas",
      parentId: catAlimentos.id,
      status: "active",
      isVisible: true,
    },
  });

  const catQueijos = await prisma.category.upsert({
    where: { slug: "conservas-e-queijos" },
    update: { parentId: catAlimentos.id },
    create: {
      name: "Conservas e Queijos",
      slug: "conservas-e-queijos",
      description: "Queijos maturados e derivados de leite",
      parentId: catAlimentos.id,
      status: "active",
      isVisible: true,
    },
  });

  const catCachacas = await prisma.category.upsert({
    where: { slug: "cachacas-artesanais" },
    update: { parentId: catBebidas.id },
    create: {
      name: "Cachaças Artesanais",
      slug: "cachacas-artesanais",
      description: "Cachaças de alambique envelhecidas em madeira",
      parentId: catBebidas.id,
      status: "active",
      isVisible: true,
    },
  });

  const catLicores = await prisma.category.upsert({
    where: { slug: "licores-regionais" },
    update: { parentId: catBebidas.id },
    create: {
      name: "Licores Regionais",
      slug: "licores-regionais",
      description: "Licores artesanais de frutas nativas",
      parentId: catBebidas.id,
      status: "active",
      isVisible: true,
    },
  });

  // 7. Marcas
  const brandCanastra = await prisma.brand.upsert({
    where: { slug: "serra-da-canastra" },
    update: {},
    create: {
      name: "Serra da Canastra",
      slug: "serra-da-canastra",
      description: "Tradição em queijos maturados da Canastra",
      status: "active",
      isVisible: true,
    },
  });

  const brandApiario = await prisma.brand.upsert({
    where: { slug: "apiario-serra-verde" },
    update: {},
    create: {
      name: "Apiário Serra Verde",
      slug: "apiario-serra-verde",
      description: "Produtos apícolas certificados e floradas puras",
      status: "active",
      isVisible: true,
    },
  });

  const brandBoaEsperanca = await prisma.brand.upsert({
    where: { slug: "engenho-boa-esperanca" },
    update: {},
    create: {
      name: "Engenho Boa Esperança",
      slug: "engenho-boa-esperanca",
      description: "Alambique artesanal de cachaça de minas",
      status: "active",
      isVisible: true,
    },
  });

  const brandDocesVovo = await prisma.brand.upsert({
    where: { slug: "doces-da-vovo" },
    update: {},
    create: {
      name: "Doces da Vovó",
      slug: "doces-da-vovo",
      description: "Receitas caseiras tradicionais mineiras",
      status: "active",
      isVisible: true,
    },
  });

  console.log("✅ Categorias hierárquicas e Marcas cadastradas.");

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const dateInDays = (days: number) => new Date(now + days * DAY_MS);

  let seedProductCount = 0;

  async function seedProduct(opts: {
    store: { id: string; name: string };
    category: { id: string; name: string };
    brand?: { id: string; name: string };
    name: string;
    slug: string;
    shortDescription: string;
    fullDescription: string;
    type?: "simple" | "variable";
    isFeatured?: boolean;
    isPublished?: boolean;
    status?: "active" | "draft" | "archived" | "inactive";
    deletedAt?: Date | null;
    hasBatchControl?: boolean;
    hasExpirationControl?: boolean;
    variations: Array<{
      sku: string;
      barcode?: string;
      price: number;
      promotionalPrice?: number;
      isDefault?: boolean;
      status?: "active" | "inactive";
      attributes?: Record<string, string>;
      stockQuantity?: number;
      lots?: Array<{
        lotNumber: string;
        expirationDays: number;
        status?: "available" | "quarantine" | "blocked";
        quantity: number;
      }>;
    }>;
  }) {
    const locationId = storeLocations[opts.store.id];
    seedProductCount++;

    const product = await prisma.product.upsert({
      where: { storeId_slug: { storeId: opts.store.id, slug: opts.slug } },
      update: {
        name: opts.name,
        shortDescription: opts.shortDescription,
        fullDescription: opts.fullDescription,
        status: opts.status || "active",
        isPublished: opts.isPublished ?? true,
        isFeatured: opts.isFeatured ?? false,
        deletedAt: opts.deletedAt || null,
        hasBatchControl: opts.hasBatchControl ?? false,
        hasExpirationControl: opts.hasExpirationControl ?? false,
      },
      create: {
        storeId: opts.store.id,
        categoryId: opts.category.id,
        brandId: opts.brand?.id || null,
        name: opts.name,
        slug: opts.slug,
        shortDescription: opts.shortDescription,
        fullDescription: opts.fullDescription,
        type: opts.type || "simple",
        status: opts.status || "active",
        isPublished: opts.isPublished ?? true,
        isFeatured: opts.isFeatured ?? false,
        deletedAt: opts.deletedAt || null,
        hasBatchControl: opts.hasBatchControl ?? false,
        hasExpirationControl: opts.hasExpirationControl ?? false,
      },
    });

    for (const varData of opts.variations) {
      if (varData.barcode && !isValidGtin(varData.barcode)) {
        throw new Error(`[Seed Error] Código de barras inválido para GTIN/EAN: ${varData.barcode}`);
      }

      const variation = await prisma.productVariation.upsert({
        where: { storeId_sku: { storeId: opts.store.id, sku: varData.sku } },
        update: {
          price: varData.price,
          promotionalPrice: varData.promotionalPrice || null,
          isDefault: varData.isDefault ?? false,
          status: varData.status || "active",
          barcode: varData.barcode || null,
        },
        create: {
          storeId: opts.store.id,
          productId: product.id,
          sku: varData.sku,
          barcode: varData.barcode || null,
          price: varData.price,
          promotionalPrice: varData.promotionalPrice || null,
          isDefault: varData.isDefault ?? false,
          status: varData.status || "active",
        },
      });

      if (varData.attributes) {
        for (const [optName, valName] of Object.entries(varData.attributes)) {
          let option = await prisma.productOption.findFirst({
            where: { productId: product.id, name: optName },
          });
          if (!option) {
            option = await prisma.productOption.create({
              data: { productId: product.id, name: optName },
            });
          }

          let optValue = await prisma.productOptionValue.findFirst({
            where: { optionId: option.id, value: valName },
          });
          if (!optValue) {
            optValue = await prisma.productOptionValue.create({
              data: { optionId: option.id, value: valName },
            });
          }

          await prisma.productVariationValue.upsert({
            where: {
              variationId_optionValueId: {
                variationId: variation.id,
                optionValueId: optValue.id,
              },
            },
            update: {},
            create: {
              variationId: variation.id,
              optionValueId: optValue.id,
            },
          });
        }
      }

      if (varData.lots && varData.lots.length > 0 && locationId) {
        for (const lotInfo of varData.lots) {
          const expDate = dateInDays(lotInfo.expirationDays);
          const mfgDate = dateInDays(lotInfo.expirationDays - 180);

          const lot = await prisma.productLot.upsert({
            where: {
              storeId_productId_variationId_lotNumber: {
                storeId: opts.store.id,
                productId: product.id,
                variationId: variation.id,
                lotNumber: lotInfo.lotNumber,
              },
            },
            update: {
              expirationDate: expDate,
              status: lotInfo.status || "available",
            },
            create: {
              storeId: opts.store.id,
              productId: product.id,
              variationId: variation.id,
              lotNumber: lotInfo.lotNumber,
              manufacturingDate: mfgDate,
              expirationDate: expDate,
              status: lotInfo.status || "available",
            },
          });

          await prisma.stockItem.upsert({
            where: {
              storeId_variationId_lotId_locationId: {
                storeId: opts.store.id,
                variationId: variation.id,
                lotId: lot.id,
                locationId: locationId,
              },
            },
            update: { physicalQuantity: lotInfo.quantity },
            create: {
              storeId: opts.store.id,
              variationId: variation.id,
              lotId: lot.id,
              locationId: locationId,
              physicalQuantity: lotInfo.quantity,
              reservedQuantity: 0,
            },
          });
        }
      } else if (locationId && varData.stockQuantity !== undefined) {
        const existingItem = await prisma.stockItem.findFirst({
          where: {
            storeId: opts.store.id,
            variationId: variation.id,
            locationId: locationId,
            lotId: null,
          },
        });

        if (existingItem) {
          await prisma.stockItem.update({
            where: { id: existingItem.id },
            data: { physicalQuantity: varData.stockQuantity },
          });
        } else {
          await prisma.stockItem.create({
            data: {
              storeId: opts.store.id,
              variationId: variation.id,
              lotId: null,
              locationId: locationId,
              physicalQuantity: varData.stockQuantity,
              reservedQuantity: 0,
            },
          });
        }
      }
    }
  }

  // 8. Catálogo com Barcodes Válidos EAN-13 (GS1 Modulo 10 Checksum Verified)
  // EAN-13 Exemplo: 7891234567895 (check: 5), 7891234567886 (check: 6), 7891234567879 (check: 9), 7891234567864 (check: 4)

  // --- MEL E DERIVADOS ---
  await seedProduct({
    store: storeMel,
    category: catMel,
    brand: brandApiario,
    name: "Mel Silvestre Orgânico 500g",
    slug: "mel-silvestre-organico-500g",
    shortDescription: "Mel 100% puro de florada silvestre nativa das montanhas",
    fullDescription: "Extraído a frio preservando todas as propriedades nutricionais e enzimas naturais.",
    isFeatured: true,
    hasBatchControl: true,
    hasExpirationControl: true,
    variations: [
      {
        sku: "MEL-SILV-500G",
        barcode: "7891234567895", // Valid GS1 EAN-13 (check: 5)
        price: 38.0,
        promotionalPrice: 32.9,
        isDefault: true,
        attributes: { "Florada": "Silvestre", "Peso": "500g" },
        lots: [
          { lotNumber: "LOTE-MEL-01-PROXIMO", expirationDays: 15, status: "available", quantity: 20 },
          { lotNumber: "LOTE-MEL-02-LONGO", expirationDays: 90, status: "available", quantity: 50 },
          { lotNumber: "LOTE-MEL-03-VENCIDO", expirationDays: -10, status: "available", quantity: 10 },
          { lotNumber: "LOTE-MEL-04-QUARENTENA", expirationDays: 45, status: "quarantine", quantity: 15 },
        ],
      },
    ],
  });

  await seedProduct({
    store: storeMel,
    category: catMel,
    brand: brandApiario,
    name: "Mel Silvestre Premium Pote",
    slug: "mel-silvestre-premium-pote",
    shortDescription: "Mel de florada silvestre selecionada em pote hermético",
    fullDescription: "Embalagem especial em vidro com vedação hermética para alta conservação.",
    type: "variable",
    variations: [
      {
        sku: "MEL-SILV-VAR-500G",
        price: 42.0,
        isDefault: true,
        attributes: { "Florada": "Silvestre", "Peso": "500g" },
        stockQuantity: 40,
      },
      {
        sku: "MEL-SILV-VAR-1KG",
        price: 75.0,
        promotionalPrice: 68.0,
        attributes: { "Florada": "Silvestre", "Peso": "1kg" },
        stockQuantity: 25,
      },
    ],
  });

  await seedProduct({
    store: storeMel,
    category: catMel,
    brand: brandApiario,
    name: "Mel de Eucalipto Puro 500g",
    slug: "mel-de-eucalipto-puro-500g",
    shortDescription: "Mel encorpado de florada de eucalipto com sabor intenso",
    fullDescription: "Ideal para adoçar bebidas quentes e combater resfriados de forma natural.",
    variations: [
      {
        sku: "MEL-EUCA-500G",
        barcode: "7891234567888", // Valid GS1 EAN-13 (check: 8)
        price: 34.0,
        isDefault: true,
        attributes: { "Florada": "Eucalipto", "Peso": "500g" },
        stockQuantity: 30,
      },
    ],
  });

  await seedProduct({
    store: storeMel,
    category: catMel,
    brand: brandApiario,
    name: "Extrato de Própolis Vermelha 30ml",
    slug: "extrato-de-propolis-vermelha-30ml",
    shortDescription: "Extrato concentrado de própolis vermelha com alta ação antioxidante",
    fullDescription: "Produção sustentável com certificado de análise de flavonoides.",
    variations: [
      {
        sku: "PROP-VERM-30ML",
        price: 55.0,
        promotionalPrice: 48.0,
        isDefault: true,
        attributes: { "Tipo": "Extrato" },
        stockQuantity: 15,
      },
    ],
  });

  await seedProduct({
    store: storeMel,
    category: catMel,
    brand: brandApiario,
    name: "Favos de Mel In Natura 300g",
    slug: "favos-de-mel-in-natura-300g",
    shortDescription: "Favo de mel 100% natural cortado direto da colmeia",
    fullDescription: "Sinta a textura e o sabor original do favo de mel puro.",
    variations: [
      {
        sku: "FAVO-MEL-300G",
        price: 45.0,
        isDefault: true,
        attributes: { "Tipo": "Favo" },
        stockQuantity: 10,
      },
    ],
  });

  // --- CACHAÇAS E LICORES ---
  await seedProduct({
    store: storeEngenho,
    category: catCachacas,
    brand: brandBoaEsperanca,
    name: "Cachaça Artesanal Amburana 750ml",
    slug: "cachaca-artesanal-amburana-750ml",
    shortDescription: "Cachaça de alambique envelhecida em barris de Amburana",
    fullDescription: "Aroma adocicado com notas de baunilha e baixa acidez.",
    isFeatured: true,
    variations: [
      {
        sku: "CACH-AMB-750",
        barcode: "7891234567871", // Valid GS1 EAN-13 (check: 1)
        price: 68.0,
        promotionalPrice: 59.9,
        isDefault: true,
        attributes: { "Madeira": "Amburana", "Volume": "750ml" },
        stockQuantity: 50,
      },
    ],
  });

  await seedProduct({
    store: storeEngenho,
    category: catCachacas,
    brand: brandBoaEsperanca,
    name: "Cachaça Reserva Boa Esperança",
    slug: "cachaca-reserva-boa-esperanca",
    shortDescription: "Cachaça premium envelhecida especial do Engenho Boa Esperança",
    fullDescription: "Destilação artesanal em alambique de cobre com descanso de 3 anos.",
    type: "variable",
    variations: [
      {
        sku: "CACH-RES-750",
        price: 85.0,
        isDefault: true,
        attributes: { "Madeira": "Amburana", "Volume": "750ml" },
        stockQuantity: 20,
      },
      {
        sku: "CACH-RES-1L",
        price: 110.0,
        promotionalPrice: 99.0,
        attributes: { "Madeira": "Amburana", "Volume": "1L" },
        stockQuantity: 15,
      },
    ],
  });

  await seedProduct({
    store: storeEngenho,
    category: catCachacas,
    brand: brandBoaEsperanca,
    name: "Cachaça Envelhecida Carvalho 750ml",
    slug: "cachaca-envelhecida-carvalho-750ml",
    shortDescription: "Cachaça envelhecida em barris de carvalho francês por 2 anos",
    fullDescription: "Sabor amadeirado marcante e cor dourada intensa.",
    variations: [
      {
        sku: "CACH-CARV-750",
        barcode: "7891234567864", // Valid GS1 EAN-13 (check: 4)
        price: 72.0,
        isDefault: true,
        attributes: { "Madeira": "Carvalho", "Volume": "750ml" },
        stockQuantity: 35,
      },
    ],
  });


  await seedProduct({
    store: storeEngenho,
    category: catCachacas,
    brand: brandBoaEsperanca,
    name: "Cachaça Prata Tradicional 670ml",
    slug: "cachaca-prata-tradicional-670ml",
    shortDescription: "Cachaça cristalina descansada em dornas de inox",
    fullDescription: "Sabor puro de cana-de-açúcar fresco, ideal para caipirinhas.",
    variations: [
      {
        sku: "CACH-PRAT-670",
        price: 35.0,
        isDefault: true,
        attributes: { "Madeira": "Inox", "Volume": "670ml" },
        stockQuantity: 60,
      },
    ],
  });

  await seedProduct({
    store: storeEngenho,
    category: catLicores,
    brand: brandBoaEsperanca,
    name: "Licor Artesanal de Jabuticaba 500ml",
    slug: "licor-artesanal-de-jabuticaba-500ml",
    shortDescription: "Licor macertado com jabuticabas frescas colhidas na fazenda",
    fullDescription: "Bebida suave, aveludada e doce na medida certa.",
    variations: [
      {
        sku: "LICOR-JABU-500",
        price: 45.0,
        promotionalPrice: 39.9,
        isDefault: true,
        attributes: { "Sabor": "Jabuticaba", "Volume": "500ml" },
        stockQuantity: 25,
      },
    ],
  });

  // --- QUEIJOS E CONSERVAS ---
  await seedProduct({
    store: storeAlvorada,
    category: catQueijos,
    brand: brandCanastra,
    name: "Queijo Canastra Meia Cura 500g",
    slug: "queijo-canastra-meia-cura-500g",
    shortDescription: "Queijo artesanal da Canastra maturado por 14 dias",
    fullDescription: "Produzido com leite cru de vaca na região da Serra da Canastra com casca amarelada.",
    isFeatured: true,
    hasBatchControl: true,
    hasExpirationControl: true,
    variations: [
      {
        sku: "CANASTRA-MC-500G",
        barcode: "7891234567857", // Valid EAN-13
        price: 49.9,
        promotionalPrice: 44.9,
        isDefault: true,
        attributes: { "Maturação": "14 Dias", "Peso": "500g" },
        lots: [
          { lotNumber: "LOTE-QUEIJO-MC-01", expirationDays: 30, status: "available", quantity: 30 },
          { lotNumber: "LOTE-QUEIJO-MC-02", expirationDays: 60, status: "available", quantity: 40 },
        ],
      },
    ],
  });

  await seedProduct({
    store: storeAlvorada,
    category: catQueijos,
    brand: brandCanastra,
    name: "Queijo Canastra Real Curado 1kg",
    slug: "queijo-canastra-real-curado-1kg",
    shortDescription: "Queijo maturado por 30 dias com mofo branco natural",
    fullDescription: "Sabor picante e textura firme, medalha de ouro em concurso regional.",
    hasBatchControl: true,
    hasExpirationControl: true,
    variations: [
      {
        sku: "CANASTRA-CUR-1KG",
        price: 95.0,
        isDefault: true,
        attributes: { "Maturação": "30 Dias", "Peso": "1kg" },
        lots: [
          { lotNumber: "LOTE-QUEIJO-CUR-01", expirationDays: 45, status: "available", quantity: 15 },
        ],
      },
    ],
  });

  await seedProduct({
    store: storeAlvorada,
    category: catQueijos,
    brand: brandCanastra,
    name: "Requeijão de Corte Caipira 400g",
    slug: "requeijao-de-corte-caipira-400g",
    shortDescription: "Requeijão de raspa macio grelhado na chapa",
    fullDescription: "Receita antiga com raspa de tacho que derrete na boca.",
    variations: [
      {
        sku: "REQ-CORTE-400G",
        price: 32.0,
        isDefault: true,
        attributes: { "Tipo": "Corte", "Peso": "400g" },
        stockQuantity: 20,
      },
    ],
  });

  await seedProduct({
    store: storeAlvorada,
    category: catQueijos,
    brand: brandCanastra,
    name: "Manteiga de Garrafa Artesanal 500ml",
    slug: "manteiga-de-garrafa-artesanal-500ml",
    shortDescription: "Manteiga de garrafa clarificada com aroma caipira",
    fullDescription: "Essencial para finalizar pratos caipiras e grelhados.",
    variations: [
      {
        sku: "MANT-GARR-500",
        price: 29.9,
        isDefault: true,
        attributes: { "Volume": "500ml" },
        stockQuantity: 5,
      },
    ],
  });

  // --- DOCES ARTESANAIS ---
  await seedProduct({
    store: storeDoces,
    category: catDoces,
    brand: brandDocesVovo,
    name: "Doce de Leite Viçosa Tradicional",
    slug: "doce-de-leite-vicosa-tradicional",
    shortDescription: "O mais premiado doce de leite de Minas Gerais em pote de vidro",
    fullDescription: "Cremoso, sem adição de conservantes artificiais.",
    type: "variable",
    isFeatured: true,
    variations: [
      {
        sku: "DOCE-LEITE-400G",
        price: 28.0,
        promotionalPrice: 24.9,
        isDefault: true,
        attributes: { "Sabor": "Tradicional", "Peso": "400g" },
        stockQuantity: 50,
      },
      {
        sku: "DOCE-LEITE-800G",
        price: 48.0,
        attributes: { "Sabor": "Tradicional", "Peso": "800g" },
        stockQuantity: 30,
      },
    ],
  });

  await seedProduct({
    store: storeDoces,
    category: catDoces,
    brand: brandDocesVovo,
    name: "Doce de Leite com Coco 400g",
    slug: "doce-de-leite-com-coco-400g",
    shortDescription: "Doce de leite cremoso misturado com coco ralado fresco",
    fullDescription: "Combinação perfeita entre o doce tradicional e o crocante do coco.",
    variations: [
      {
        sku: "DOCE-COCO-400G",
        price: 29.9,
        promotionalPrice: 25.9,
        isDefault: true,
        attributes: { "Sabor": "Coco", "Peso": "400g" },
        stockQuantity: 25,
      },
    ],
  });

  await seedProduct({
    store: storeDoces,
    category: catDoces,
    brand: brandDocesVovo,
    name: "Goiabada Cascão Artesanal 500g",
    slug: "goiabada-cascao-artesanal-500g",
    shortDescription: "Goiabada cascão de tacho de cobre com pedaços de fruta",
    fullDescription: "Feita com goiabas maduras selecionadas e pouco açúcar.",
    variations: [
      {
        sku: "GOIAB-CASC-500G",
        price: 24.0,
        isDefault: true,
        attributes: { "Tipo": "Cascão", "Peso": "500g" },
        stockQuantity: 40,
      },
    ],
  });

  await seedProduct({
    store: storeDoces,
    category: catDoces,
    brand: brandDocesVovo,
    name: "Paçoca Caseira de Amendoim 300g",
    slug: "pacoca-caseira-de-amendoim-300g",
    shortDescription: "Paçoca rolha crocante de amendoim torrado moído na hora",
    fullDescription: "Sabor de infância sem glúten e sem conservantes.",
    variations: [
      {
        sku: "PACOCA-AMEND-300",
        price: 18.0,
        isDefault: true,
        attributes: { "Tipo": "Rolha", "Peso": "300g" },
        stockQuantity: 60,
      },
    ],
  });

  await seedProduct({
    store: storeDoces,
    category: catDoces,
    brand: brandDocesVovo,
    name: "Pé de Moleque Crocante 250g",
    slug: "pe-de-moleque-crocante-250g",
    shortDescription: "Pé de moleque tradicional com rapadura e amendoim inteiro",
    fullDescription: "Crocante e saboroso, embalado individualmente.",
    variations: [
      {
        sku: "PE-MOLEQUE-250G",
        price: 16.5,
        isDefault: true,
        attributes: { "Tipo": "Tradicional", "Peso": "250g" },
        stockQuantity: 0,
      },
    ],
  });

  await seedProduct({
    store: storeDoces,
    category: catDoces,
    brand: brandDocesVovo,
    name: "Açúcar Mascavo Puro 1kg",
    slug: "acucar-mascavo-puro-1kg",
    shortDescription: "Açúcar mascavo não refinado de cana orgânica",
    fullDescription: "Rico em ferro e minerais naturais.",
    variations: [
      {
        sku: "ACUCAR-MASC-1KG",
        price: 15.0,
        isDefault: true,
        attributes: { "Tipo": "Orgânico", "Peso": "1kg" },
        stockQuantity: 30,
      },
    ],
  });

  await seedProduct({
    store: storeDoces,
    category: catDoces,
    brand: brandDocesVovo,
    name: "Compota de Figo Ramy 400g",
    slug: "compota-de-figo-ramy-400g",
    shortDescription: "Figos ramy inteiros em calda leve artesanal",
    fullDescription: "Perfeito para acompanhar queijos maturados da Canastra.",
    variations: [
      {
        sku: "FIGO-RAMY-400G",
        price: 36.0,
        isDefault: true,
        attributes: { "Peso": "400g" },
        stockQuantity: 18,
      },
    ],
  });

  // --- PRODUTOS PARA TESTE DE GUARDS E VISIBILIDADE ---
  await seedProduct({
    store: storeMel,
    category: catMel,
    brand: brandApiario,
    name: "Produto Rascunho Não Publicado",
    slug: "produto-rascunho-nao-publicado",
    shortDescription: "Este produto está como rascunho e não publicado",
    fullDescription: "Guarda para testar filtro isPublished: false no Discovery público.",
    isPublished: false,
    status: "draft",
    variations: [
      {
        sku: "RASCUNHO-01",
        price: 99.0,
        isDefault: true,
        stockQuantity: 10,
      },
    ],
  });

  await seedProduct({
    store: storeAlvorada,
    category: catQueijos,
    brand: brandCanastra,
    name: "Queijo Canastra Arquivado Antigo",
    slug: "queijo-canastra-arquivado-antigo",
    shortDescription: "Produto arquivado soft-deleted",
    fullDescription: "Guarda para testar filtro status: archived e deletedAt.",
    status: "archived",
    deletedAt: new Date(),
    variations: [
      {
        sku: "ARQUIVADO-01",
        price: 50.0,
        isDefault: true,
        stockQuantity: 0,
      },
    ],
  });

  await seedProduct({
    store: storeInativa,
    category: catQueijos,
    brand: brandCanastra,
    name: "Queijo de Fazenda Inativa Suspensa",
    slug: "queijo-de-fazenda-inativa-suspensa",
    shortDescription: "Produto de loja suspensa inativa",
    fullDescription: "Guarda para testar filtro store.status: active no Discovery público.",
    isPublished: true,
    status: "active",
    variations: [
      {
        sku: "LOJA-INATIVA-01",
        price: 40.0,
        isDefault: true,
        stockQuantity: 50,
      },
    ],
  });

  console.log(`✅ ${seedProductCount} Produtos e variações cadastrados com atributos, preços, ofertas e lotes.`);

  // 9. Configurações Iniciais do Marketplace
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
  console.log("✅ Configurações padrão do Marketplace cadastradas.");

  // 10. Reconstruir Projeção de Busca (ProductSearchDocument)
  console.log("🔍 Sincronizando ProductSearchDocuments...");
  const syncedCount = await ProductSearchIndexService.rebuildAllSearchDocuments();

  const report = await ProductSearchIndexService.getDiscrepancyReport();
  console.log(`📊 Relatório de Projeção de Busca:`);
  console.log(`  - Produtos adicionados/atualizados nesta seed: ${seedProductCount}`);
  console.log(`  - Total de produtos ativos existentes no banco: ${report.totalActiveProducts}`);
  console.log(`  - Total de ProductSearchDocuments sintetizados: ${syncedCount}`);

  console.log(`  - Discrepâncias ausentes: ${report.missingDocumentProductIds.length}`);
  console.log(`  - Discrepâncias órfãs: ${report.orphanDocumentProductIds.length}`);

  if (report.missingDocumentProductIds.length > 0 || report.orphanDocumentProductIds.length > 0) {
    console.warn("⚠️ Discrepâncias detectadas na projeção de busca!");
  } else {
    console.log("🎉 Seed concluída com SUCESSO! Relação 1:1 exata (1 Produto = 1 Documento de Busca, 0 Discrepâncias).");
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
