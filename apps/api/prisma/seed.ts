import { prisma } from "../src/infrastructure/database/prisma.js";

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

  // Products module (future)
  { key: "products.read", module: "products", description: "Visualizar produtos" },
  { key: "products.create", module: "products", description: "Cadastrar produtos" },
  { key: "products.update", module: "products", description: "Editar produtos" },
  { key: "products.delete", module: "products", description: "Excluir produtos" },

  // Inventory module (future)
  { key: "inventory.read", module: "inventory", description: "Visualizar estoque" },
  { key: "inventory.update", module: "inventory", description: "Atualizar estoque" },

  // Sales & Reports module (future)
  { key: "sales.read", module: "sales", description: "Visualizar vendas" },
  { key: "reports.read", module: "reports", description: "Visualizar relatórios" },
];

const rolesData = [
  { key: "admin", name: "Administrador", description: "Acesso total à plataforma Verttex", isSystem: true },
  { key: "employee", name: "Funcionário", description: "Funcionário da Verttex responsável por gestão de lojas", isSystem: true },
  { key: "supplier", name: "Fornecedor", description: "Produtor ou fornecedor parceiro responsável por loja", isSystem: true },
];

const employeePermissions = ["stores.read", "stores.update", "users.read", "inventory.read", "sales.read", "reports.read"];
const supplierPermissions = ["stores.read", "inventory.read", "sales.read", "reports.read"];

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Seed Permissions (Idempotent upsert)
  const permissionMap = new Map<string, string>();
  for (const perm of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
    permissionMap.set(perm.key, created.id);
  }
  console.log(`✅ ${permissionMap.size} permissions seeded.`);

  // 2. Seed Roles (Idempotent upsert)
  const roleMap = new Map<string, string>();
  for (const r of rolesData) {
    const created = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, description: r.description },
      create: r,
    });
    roleMap.set(r.key, created.id);
  }
  console.log(`✅ ${roleMap.size} roles seeded.`);

  // 3. Seed RolePermissions
  const adminRoleId = roleMap.get("admin")!;
  const employeeRoleId = roleMap.get("employee")!;
  const supplierRoleId = roleMap.get("supplier")!;

  // Admin gets all permissions
  for (const [permKey, permId] of permissionMap.entries()) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRoleId, permissionId: permId } },
      update: {},
      create: { roleId: adminRoleId, permissionId: permId },
    });
  }

  // Employee default permissions
  for (const permKey of employeePermissions) {
    const permId = permissionMap.get(permKey);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: employeeRoleId, permissionId: permId } },
        update: {},
        create: { roleId: employeeRoleId, permissionId: permId },
      });
    }
  }

  // Supplier default permissions
  for (const permKey of supplierPermissions) {
    const permId = permissionMap.get(permKey);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: supplierRoleId, permissionId: permId } },
        update: {},
        create: { roleId: supplierRoleId, permissionId: permId },
      });
    }
  }
  console.log("✅ Role permissions seeded.");

  // 4. Seed initial Admin User (Idempotent)
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@verttexloja.com.br";
  // Development password hash (placeholder for scrypt/bcrypt hashed 'admin123')
  const defaultPasswordHash = process.env.INITIAL_ADMIN_PASSWORD_HASH || "$2b$10$abcdefghijklmnopqrstuvw1234567890abcdefghijklmnopqrstuv";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador Verttex",
      email: adminEmail,
      passwordHash: defaultPasswordHash,
      status: "active",
      roleId: adminRoleId,
    },
  });
  console.log(`✅ Default admin user (${adminEmail}) seeded.`);

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
