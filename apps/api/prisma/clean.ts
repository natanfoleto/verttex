import * as crypto from "crypto";
import { prisma } from "../src/infrastructure/database/prisma.js";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

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
  { key: "products.delete", module: "products", description: "Excluir/Arquivar produtos" },
  { key: "products.publish", module: "products", description: "Publicar produtos no Marketplace" },
  { key: "products.manage-media", module: "products", description: "Gerenciar imagens e mídias do produto" },
  { key: "products.manage-price", module: "products", description: "Gerenciar preços e custos de produtos" },

  // Files module
  { key: "files.read", module: "files", description: "Visualizar mídias e arquivos" },
  { key: "files.create", module: "files", description: "Fazer upload de arquivos" },
  { key: "files.delete", module: "files", description: "Excluir mídias e arquivos" },

  // Lots module
  { key: "lots.read", module: "lots", description: "Visualizar lotes e validade de produtos" },
  { key: "lots.create", module: "lots", description: "Cadastrar novos lotes" },
  { key: "lots.update", module: "lots", description: "Editar dados do lote" },
  { key: "lots.quarantine", module: "lots", description: "Colocar ou liberar lotes da quarentena" },
  { key: "lots.block", module: "lots", description: "Bloquear ou desbloquear lotes" },
  { key: "lots.recall", module: "lots", description: "Executar ou gerenciar recolhimento (recall) de lotes" },

  // Stock module
  { key: "stock.read", module: "stock", description: "Visualizar estoque, FEFO e movimentações" },
  { key: "stock.receive", module: "stock", description: "Registrar recebimento de mercadorias por lote" },
  { key: "stock.transfer", module: "stock", description: "Transferir lotes entre localizações" },
  { key: "stock.adjust", module: "stock", description: "Realizar ajustes manuais de inventário" },
  { key: "stock.discard", module: "stock", description: "Realizar descarte formal por vencimento ou dano" },

  // Audit logs module
  { key: "audit.read", module: "audit", description: "Visualizar logs de auditoria do sistema" },
  { key: "audit.export", module: "audit", description: "Exportar relatórios de auditoria" },
];

async function main() {
  console.log("🧹 Limpando o banco de dados...");

  // Busca todas as tabelas no schema public
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tables) {
    if (tablename === "_prisma_migrations") continue;
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
    } catch (err) {
      console.warn(`Erro ao limpar tabela ${tablename}:`, err);
    }
  }

  console.log("✨ Banco de dados limpo com sucesso!");

  console.log("🔑 Semeando permissões do sistema...");
  const createdPermissions = await Promise.all(
    permissionsData.map((perm) =>
      prisma.permission.create({
        data: perm,
      }),
    ),
  );

  console.log("🛡️ Criando cargos essenciais do sistema...");
  const adminRole = await prisma.role.create({
    data: {
      name: "Administrador Global",
      key: "admin",
      description: "Acesso total a todas as funcionalidades e configurações do ecossistema",
      isSystem: true,
    },
  });

  await prisma.role.createMany({
    data: [
      {
        name: "Operador de Logística & Estoque",
        key: "employee",
        description: "Controle de recebimento, movimentações FEFO e quarentena sanitária",
        isSystem: true,
      },
      {
        name: "Produtor / Fornecedor Parceiro",
        key: "supplier",
        description: "Gestão do catálogo próprio, estoques da loja e remessas",
        isSystem: true,
      },
      {
        name: "Gerente de Loja",
        key: "store_manager",
        description: "Gestão operacional e financeira de uma loja parceira específica",
        isSystem: true,
      },
      {
        name: "Auditor Sanitário",
        key: "auditor",
        description: "Acesso de leitura e exportação para fiscalização sanitária e compliance",
        isSystem: true,
      },
    ],
  });

  console.log("🔗 Vinculando todas as permissões ao cargo Admin...");
  await prisma.rolePermission.createMany({
    data: createdPermissions.map((perm) => ({
      roleId: adminRole.id,
      permissionId: perm.id,
    })),
  });

  console.log("👤 Criando usuário Administrador único...");
  const adminPasswordHash = hashPassword("admin123");

  const adminUser = await prisma.user.create({
    data: {
      name: "Administrador Verttex",
      email: "admin@verttexloja.com.br",
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      status: "active",
    },
  });

  console.log("\n=======================================================");
  console.log("🎉 BANCO DE DADOS LIMPO E RECONFIGURADO COM SUCESSO!");
  console.log("=======================================================");
  console.log("👤 Único Usuário Registrado:");
  console.log(`- Nome:  ${adminUser.name}`);
  console.log(`- Email: ${adminUser.email}`);
  console.log("- Senha: SenhaSegura123!");
  console.log(`- Cargo: ${adminRole.name} (${adminRole.key})`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar a limpeza do banco:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
