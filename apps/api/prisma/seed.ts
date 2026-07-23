import { prisma } from '../src/infrastructure/database/prisma.js'
import { hashPassword } from '../src/shared/utils/crypto.js'

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
  { key: 'categories.read', module: 'categories', description: 'Visualizar categorias' },
  { key: 'categories.create', module: 'categories', description: 'Criar categorias' },
  { key: 'categories.update', module: 'categories', description: 'Editar categorias' },
  { key: 'categories.delete', module: 'categories', description: 'Arquivar categorias' },

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
    description: 'Excluir produtos',
  },

  // Inventory module
  {
    key: 'inventory.read',
    module: 'inventory',
    description: 'Visualizar estoque',
  },
  {
    key: 'inventory.update',
    module: 'inventory',
    description: 'Atualizar estoque',
  },

  // Sales & Reports module
  { key: 'sales.read', module: 'sales', description: 'Visualizar vendas' },
  {
    key: 'reports.read',
    module: 'reports',
    description: 'Visualizar relatórios',
  },
]

const rolesData = [
  {
    key: 'admin',
    name: 'Administrador',
    description: 'Acesso total à plataforma Verttex',
    isSystem: true,
  },
  {
    key: 'employee',
    name: 'Funcionário',
    description: 'Funcionário da Verttex responsável por gestão de lojas',
    isSystem: true,
  },
  {
    key: 'supplier',
    name: 'Fornecedor',
    description: 'Produtor ou fornecedor parceiro responsável por loja',
    isSystem: true,
  },
  {
    key: 'store_manager',
    name: 'Gerente de Loja',
    description: 'Gerente responsável pelo catálogo e operação da loja parceira',
    isSystem: false,
  },
  {
    key: 'support_analyst',
    name: 'Analista de Suporte',
    description: 'Atendimento e suporte técnico aos parceiros da plataforma',
    isSystem: false,
  },
]

const employeePermissions = [
  'stores.read',
  'stores.update',
  'users.read',
  'inventory.read',
  'sales.read',
  'reports.read',
]
const supplierPermissions = [
  'stores.read',
  'inventory.read',
  'sales.read',
  'reports.read',
]
const storeManagerPermissions = [
  'stores.read',
  'stores.update',
  'stores.manage-members',
  'products.read',
  'products.create',
  'products.update',
  'inventory.read',
  'inventory.update',
  'sales.read',
]
const supportAnalystPermissions = [
  'users.read',
  'roles.read',
  'stores.read',
  'reports.read',
]

const seedUsersData = [
  {
    name: 'Administrador Verttex',
    email: 'admin@verttexloja.com.br',
    phone: '(54) 99999-0001',
    roleKey: 'admin',
    status: 'active',
  },
  {
    name: 'Lucas Mendes',
    email: 'lucas.mendes@verttexloja.com.br',
    phone: '(54) 99999-0002',
    roleKey: 'employee',
    status: 'active',
  },
  {
    name: 'Juliana Camargo',
    email: 'juliana.camargo@verttexloja.com.br',
    phone: '(54) 99999-0003',
    roleKey: 'employee',
    status: 'active',
  },
  {
    name: 'Roberto Alvorada',
    email: 'roberto@queijariaalvorada.com.br',
    phone: '(54) 99888-1001',
    roleKey: 'supplier',
    status: 'active',
  },
  {
    name: 'Clarissa Rossi',
    email: 'clarissa@vinicolarossi.com.br',
    phone: '(54) 99888-1002',
    roleKey: 'supplier',
    status: 'active',
  },
  {
    name: 'Marcelo Vale Verde',
    email: 'marcelo@apiariovaleverde.com.br',
    phone: '(54) 99888-1003',
    roleKey: 'supplier',
    status: 'active',
  },
  {
    name: 'Eduardo Tradição',
    email: 'eduardo@embutidostradicao.com.br',
    phone: '(54) 99888-1004',
    roleKey: 'supplier',
    status: 'active',
  },
  {
    name: 'Fernanda Oliveira',
    email: 'fernanda.oliveira@docesdacolonia.com.br',
    phone: '(54) 99888-1005',
    roleKey: 'supplier',
    status: 'active',
  },
  {
    name: 'Gabriel Cafés',
    email: 'gabriel@cafesdaserra.com.br',
    phone: '(54) 99888-1006',
    roleKey: 'supplier',
    status: 'active',
  },
  {
    name: 'Paula Siqueira',
    email: 'paula.siqueira@verttexloja.com.br',
    phone: '(54) 99777-2001',
    roleKey: 'support_analyst',
    status: 'active',
  },
  {
    name: 'Thiago Martins',
    email: 'thiago.martins@verttexloja.com.br',
    phone: '(54) 99777-2002',
    roleKey: 'store_manager',
    status: 'active',
  },
  {
    name: 'Camila Rodriguez',
    email: 'camila.rodriguez@verttexloja.com.br',
    phone: '(54) 99777-2003',
    roleKey: 'employee',
    status: 'inactive',
  },
  {
    name: 'Renato Farias',
    email: 'renato.farias@verttexloja.com.br',
    phone: '(54) 99777-2004',
    roleKey: 'support_analyst',
    status: 'inactive',
  },
  {
    name: 'Sabrina Souza',
    email: 'sabrina.souza@verttexloja.com.br',
    phone: '(54) 99777-2005',
    roleKey: 'store_manager',
    status: 'active',
  },
]

const seedStoresData = [
  {
    name: 'Queijaria Alvorada',
    slug: 'queijaria-alvorada',
    description:
      'Tradição familiar na produção de queijos artesanais de leite cru com maturação especial na Serra Gaúcha.',
    status: 'active',
    ownerEmail: 'roberto@queijariaalvorada.com.br',
    coverUrl:
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Vinícola Família Rossi',
    slug: 'vinicola-familia-rossi',
    description:
      'Vinhos coloniais de pequena escala produzidos artesanalmente nos vales da serra gaúcha.',
    status: 'active',
    ownerEmail: 'clarissa@vinicolarossi.com.br',
    coverUrl:
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Apiário Vale Verde',
    slug: 'apiario-vale-verde',
    description:
      'Mel de florada nativa e produtos apícolas 100% puros e sem aditivos Químicos.',
    status: 'active',
    ownerEmail: 'marcelo@apiariovaleverde.com.br',
    coverUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Embutidos Tradição',
    slug: 'embutidos-tradicao',
    description:
      'Salames, lombos e embutidos suínos curados e defumados em lenha de macieira.',
    status: 'active',
    ownerEmail: 'eduardo@embutidostradicao.com.br',
    coverUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Doces da Colônia',
    slug: 'doces-da-colonia',
    description:
      'Geleias, compotas e chimias preparadas com frutas frescas colhidas na estação.',
    status: 'active',
    ownerEmail: 'fernanda.oliveira@docesdacolonia.com.br',
    coverUrl:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cafés da Serra',
    slug: 'cafes-da-serra',
    description:
      'Grãos especiais de torra artesanal colhidos em micro-lotes de alta altitude.',
    status: 'active',
    ownerEmail: 'gabriel@cafesdaserra.com.br',
    coverUrl:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cervejaria Artesanal Monte Real',
    slug: 'cervejaria-monte-real',
    description:
      'Cervejas vivas não filtradas com ingredientes locais e receitas tradicionais.',
    status: 'draft',
    ownerEmail: 'lucas.mendes@verttexloja.com.br',
  },
  {
    name: 'Olivas do Sul - Azeites Extra Virgem',
    slug: 'olivas-do-sul',
    description:
      'Azeites de oliva prensados a frio em menos de 4 horas após a colheita.',
    status: 'active',
    ownerEmail: 'juliana.camargo@verttexloja.com.br',
  },
  {
    name: 'Cogumelos da Serra',
    slug: 'cogumelos-da-serra',
    description:
      'Produção orgânica de Shimeji, Paris e Eringui frescos entregues semanalmente.',
    status: 'draft',
    ownerEmail: 'thiago.martins@verttexloja.com.br',
  },
  {
    name: 'Charcutaria Serrana',
    slug: 'charcutaria-serrana',
    description:
      'Pancetas, coppa e pastramis maturados lentamente com temperos coloniais.',
    status: 'inactive',
    ownerEmail: 'sabrina.souza@verttexloja.com.br',
  },
  {
    name: 'Pães & Broas Coloniais',
    slug: 'paes-broas-coloniais',
    description:
      'Pães de fermentação natural assados em forno a lenha com farinha de pedra.',
    status: 'active',
    ownerEmail: 'paula.siqueira@verttexloja.com.br',
  },
  {
    name: 'Fruteira Orgânica Vale do Sol',
    slug: 'fruteira-vale-do-sol',
    description:
      'Frutas, vegetais e grãos certificados livres de agrotóxicos.',
    status: 'suspended',
    ownerEmail: 'camila.rodriguez@verttexloja.com.br',
  },
]

const seedCustomersData = [
  {
    name: 'Mariana Silva',
    email: 'mariana.silva@gmail.com',
    phone: '(51) 98888-1111',
  },
  {
    name: 'Fernando Castro',
    email: 'fernando.castro@hotmail.com',
    phone: '(51) 98888-2222',
  },
  {
    name: 'Beatriz Almeida',
    email: 'beatriz.almeida@yahoo.com.br',
    phone: '(51) 98888-3333',
  },
  {
    name: 'Rodrigo Nogueira',
    email: 'rodrigo.nogueira@outlook.com',
    phone: '(51) 98888-4444',
  },
  {
    name: 'Patricia Lima',
    email: 'patricia.lima@gmail.com',
    phone: '(51) 98888-5555',
  },
]

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Seed Permissions (Idempotent upsert)
  const permissionMap = new Map<string, string>()
  for (const perm of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description, module: perm.module },
      create: perm,
    })
    permissionMap.set(perm.key, created.id)
  }
  console.log(`✅ ${permissionMap.size} permissions seeded.`)

  // 2. Seed Roles (Idempotent upsert)
  const roleMap = new Map<string, string>()
  for (const r of rolesData) {
    const created = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, description: r.description },
      create: r,
    })
    roleMap.set(r.key, created.id)
  }
  console.log(`✅ ${roleMap.size} roles seeded.`)

  // 3. Seed RolePermissions
  const adminRoleId = roleMap.get('admin')!
  const employeeRoleId = roleMap.get('employee')!
  const supplierRoleId = roleMap.get('supplier')!
  const storeManagerRoleId = roleMap.get('store_manager')!
  const supportAnalystRoleId = roleMap.get('support_analyst')!

  // Admin gets all permissions
  for (const permId of permissionMap.values()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRoleId, permissionId: permId },
      },
      update: {},
      create: { roleId: adminRoleId, permissionId: permId },
    })
  }

  // Employee default permissions
  for (const permKey of employeePermissions) {
    const permId = permissionMap.get(permKey)
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: employeeRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: employeeRoleId, permissionId: permId },
      })
    }
  }

  // Supplier default permissions
  for (const permKey of supplierPermissions) {
    const permId = permissionMap.get(permKey)
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: supplierRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: supplierRoleId, permissionId: permId },
      })
    }
  }

  // Store Manager permissions
  for (const permKey of storeManagerPermissions) {
    const permId = permissionMap.get(permKey)
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: storeManagerRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: storeManagerRoleId, permissionId: permId },
      })
    }
  }

  // Support Analyst permissions
  for (const permKey of supportAnalystPermissions) {
    const permId = permissionMap.get(permKey)
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: supportAnalystRoleId, permissionId: permId },
        },
        update: {},
        create: { roleId: supportAnalystRoleId, permissionId: permId },
      })
    }
  }
  console.log('✅ Role permissions seeded.')

  // 4. Seed Users
  const defaultPasswordHash = await hashPassword('admin123')
  const userMap = new Map<string, string>()

  for (const u of seedUsersData) {
    const targetRoleId = roleMap.get(u.roleKey) || adminRoleId
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        status: u.status,
        roleId: targetRoleId,
      },
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: defaultPasswordHash,
        status: u.status,
        roleId: targetRoleId,
      },
    })
    userMap.set(u.email, created.id)
  }
  console.log(`✅ ${userMap.size} management users seeded.`)

  // 5. Seed Stores & Store Members
  let storeCount = 0
  for (const st of seedStoresData) {
    const store = await prisma.store.upsert({
      where: { slug: st.slug },
      update: {
        name: st.name,
        description: st.description,
        status: st.status,
        coverUrl: st.coverUrl,
      },
      create: {
        name: st.name,
        slug: st.slug,
        description: st.description,
        status: st.status,
        coverUrl: st.coverUrl,
      },
    })
    storeCount++

    // Link owner user to store
    const ownerUserId = userMap.get(st.ownerEmail)
    if (ownerUserId) {
      await prisma.storeUser.upsert({
        where: {
          storeId_userId: { storeId: store.id, userId: ownerUserId },
        },
        update: { isOwner: true },
        create: {
          storeId: store.id,
          userId: ownerUserId,
          isOwner: true,
        },
      })
    }
  }
  console.log(`✅ ${storeCount} stores & store members seeded.`)

  // 6. Seed Customers
  for (const cust of seedCustomersData) {
    await prisma.customer.upsert({
      where: { email: cust.email },
      update: { name: cust.name, phone: cust.phone },
      create: {
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
        passwordHash: defaultPasswordHash,
        status: 'active',
      },
    })
  }
  console.log(`✅ ${seedCustomersData.length} customer buyers seeded.`)

  // 7. Seed Audit Logs (40 entries for pagination testing)
  const adminUserId = userMap.get('admin@verttexloja.com.br')!
  const lucasUserId = userMap.get('lucas.mendes@verttexloja.com.br')!
  const julianaUserId = userMap.get('juliana.camargo@verttexloja.com.br')!
  const paulaUserId = userMap.get('paula.siqueira@verttexloja.com.br')!
  const thiagoUserId = userMap.get('thiago.martins@verttexloja.com.br')!

  const auditEvents = [
    {
      userId: adminUserId,
      action: 'user.create',
      entity: 'User',
      entityId: userMap.get('roberto@queijariaalvorada.com.br'),
      oldValues: null,
      newValues: { name: 'Roberto Alvorada', role: 'supplier' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: adminUserId,
      action: 'store.create',
      entity: 'Store',
      entityId: 'st_queijaria_1',
      oldValues: null,
      newValues: { name: 'Queijaria Alvorada', slug: 'queijaria-alvorada' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: lucasUserId,
      action: 'store.update',
      entity: 'Store',
      entityId: 'st_vinicola_rossi',
      oldValues: { status: 'draft' },
      newValues: { status: 'active' },
      ipAddress: '189.40.12.98',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      userId: adminUserId,
      action: 'user.permissions.update',
      entity: 'UserPermission',
      entityId: lucasUserId,
      oldValues: { effect: 'deny' },
      newValues: { effect: 'allow', permission: 'stores.update' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: julianaUserId,
      action: 'role.update',
      entity: 'Role',
      entityId: storeManagerRoleId,
      oldValues: { name: 'Gerente' },
      newValues: { name: 'Gerente de Loja' },
      ipAddress: '201.86.55.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    },
    {
      userId: adminUserId,
      action: 'store.user.add',
      entity: 'StoreUser',
      entityId: 'su_link_01',
      oldValues: null,
      newValues: { store: 'Apiário Vale Verde', user: 'Marcelo Vale Verde' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: lucasUserId,
      action: 'user.update',
      entity: 'User',
      entityId: userMap.get('camila.rodriguez@verttexloja.com.br'),
      oldValues: { status: 'active' },
      newValues: { status: 'inactive' },
      ipAddress: '189.40.12.98',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      userId: adminUserId,
      action: 'store.create',
      entity: 'Store',
      entityId: 'st_olivas_sul',
      oldValues: null,
      newValues: { name: 'Olivas do Sul', status: 'active' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: julianaUserId,
      action: 'user.create',
      entity: 'User',
      entityId: userMap.get('paula.siqueira@verttexloja.com.br'),
      oldValues: null,
      newValues: { name: 'Paula Siqueira', role: 'support_analyst' },
      ipAddress: '201.86.55.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    },
    {
      userId: adminUserId,
      action: 'user.permissions.update',
      entity: 'UserPermission',
      entityId: thiagoUserId,
      oldValues: { effect: 'inherit' },
      newValues: { effect: 'allow', permission: 'inventory.update' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: paulaUserId,
      action: 'store.update',
      entity: 'Store',
      entityId: 'st_cogumelos_serra',
      oldValues: { status: 'draft' },
      newValues: { status: 'active' },
      ipAddress: '177.200.45.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: adminUserId,
      action: 'role.create',
      entity: 'Role',
      entityId: supportAnalystRoleId,
      oldValues: null,
      newValues: { key: 'support_analyst', name: 'Analista de Suporte' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: lucasUserId,
      action: 'store.user.add',
      entity: 'StoreUser',
      entityId: 'su_link_02',
      oldValues: null,
      newValues: { store: 'Charcutaria Serrana', user: 'Sabrina Souza' },
      ipAddress: '189.40.12.98',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      userId: julianaUserId,
      action: 'user.update',
      entity: 'User',
      entityId: userMap.get('renato.farias@verttexloja.com.br'),
      oldValues: { status: 'active' },
      newValues: { status: 'inactive' },
      ipAddress: '201.86.55.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    },
    {
      userId: adminUserId,
      action: 'store.delete',
      entity: 'Store',
      entityId: 'st_fruteira_sol',
      oldValues: { status: 'active' },
      newValues: { status: 'suspended' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: thiagoUserId,
      action: 'product.create',
      entity: 'Product',
      entityId: 'prod_01',
      oldValues: null,
      newValues: { name: 'Queijo Meia Cura', price: 48.9 },
      ipAddress: '177.190.88.33',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
    },
    {
      userId: adminUserId,
      action: 'role.permissions.update',
      entity: 'RolePermission',
      entityId: employeeRoleId,
      oldValues: null,
      newValues: { permissionsCount: 6 },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: paulaUserId,
      action: 'user.create',
      entity: 'User',
      entityId: userMap.get('sabrina.souza@verttexloja.com.br'),
      oldValues: null,
      newValues: { name: 'Sabrina Souza', role: 'store_manager' },
      ipAddress: '177.200.45.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: lucasUserId,
      action: 'store.update',
      entity: 'Store',
      entityId: 'st_paes_broas',
      oldValues: { name: 'Pães Coloniais' },
      newValues: { name: 'Pães & Broas Coloniais' },
      ipAddress: '189.40.12.98',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      userId: adminUserId,
      action: 'user.permissions.update',
      entity: 'UserPermission',
      entityId: julianaUserId,
      oldValues: { effect: 'allow' },
      newValues: { effect: 'deny', permission: 'users.delete' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: null,
      action: 'system.cron.cleanup',
      entity: 'System',
      entityId: 'sys_job_cleanup',
      oldValues: null,
      newValues: { cleanedSessions: 14 },
      ipAddress: '127.0.0.1',
      userAgent: 'VerttexWorker/1.0',
    },
    {
      userId: adminUserId,
      action: 'user.update',
      entity: 'User',
      entityId: userMap.get('lucas.mendes@verttexloja.com.br'),
      oldValues: { phone: null },
      newValues: { phone: '(54) 99999-0002' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: julianaUserId,
      action: 'store.create',
      entity: 'Store',
      entityId: 'st_cafes_serra',
      oldValues: null,
      newValues: { name: 'Cafés da Serra', slug: 'cafes-da-serra' },
      ipAddress: '201.86.55.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    },
    {
      userId: paulaUserId,
      action: 'store.user.remove',
      entity: 'StoreUser',
      entityId: 'su_link_old',
      oldValues: { store: 'Charcutaria Serrana', user: 'Camila Rodriguez' },
      newValues: null,
      ipAddress: '177.200.45.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: adminUserId,
      action: 'role.update',
      entity: 'Role',
      entityId: supplierRoleId,
      oldValues: { description: 'Fornecedor parceiro' },
      newValues: { description: 'Produtor ou fornecedor parceiro responsável por loja' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: lucasUserId,
      action: 'user.create',
      entity: 'User',
      entityId: userMap.get('clarissa@vinicolarossi.com.br'),
      oldValues: null,
      newValues: { name: 'Clarissa Rossi', role: 'supplier' },
      ipAddress: '189.40.12.98',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      userId: adminUserId,
      action: 'store.update',
      entity: 'Store',
      entityId: 'st_embutidos_tradicao',
      oldValues: { status: 'draft' },
      newValues: { status: 'active' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: thiagoUserId,
      action: 'inventory.update',
      entity: 'Inventory',
      entityId: 'inv_01',
      oldValues: { stock: 10 },
      newValues: { stock: 45 },
      ipAddress: '177.190.88.33',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
    },
    {
      userId: paulaUserId,
      action: 'user.permissions.update',
      entity: 'UserPermission',
      entityId: userMap.get('paula.siqueira@verttexloja.com.br'),
      oldValues: null,
      newValues: { effect: 'allow', permission: 'reports.read' },
      ipAddress: '177.200.45.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: adminUserId,
      action: 'user.create',
      entity: 'User',
      entityId: userMap.get('marcelo@apiariovaleverde.com.br'),
      oldValues: null,
      newValues: { name: 'Marcelo Vale Verde', role: 'supplier' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: julianaUserId,
      action: 'store.create',
      entity: 'Store',
      entityId: 'st_doces_colonia',
      oldValues: null,
      newValues: { name: 'Doces da Colônia', slug: 'doces-da-colonia' },
      ipAddress: '201.86.55.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    },
    {
      userId: lucasUserId,
      action: 'store.user.add',
      entity: 'StoreUser',
      entityId: 'su_link_03',
      oldValues: null,
      newValues: { store: 'Doces da Colônia', user: 'Fernanda Oliveira' },
      ipAddress: '189.40.12.98',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      userId: adminUserId,
      action: 'role.create',
      entity: 'Role',
      entityId: storeManagerRoleId,
      oldValues: null,
      newValues: { key: 'store_manager', name: 'Gerente de Loja' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: null,
      action: 'system.backup.create',
      entity: 'System',
      entityId: 'sys_backup_daily',
      oldValues: null,
      newValues: { sizeMb: 248, status: 'success' },
      ipAddress: '127.0.0.1',
      userAgent: 'VerttexWorker/1.0',
    },
    {
      userId: paulaUserId,
      action: 'store.update',
      entity: 'Store',
      entityId: 'st_cervejaria_monte',
      oldValues: { description: 'Cervejas' },
      newValues: { description: 'Cervejas vivas não filtradas com ingredientes locais' },
      ipAddress: '177.200.45.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: adminUserId,
      action: 'user.update',
      entity: 'User',
      entityId: userMap.get('eduardo@embutidostradicao.com.br'),
      oldValues: { name: 'Eduardo' },
      newValues: { name: 'Eduardo Tradição' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: julianaUserId,
      action: 'user.permissions.update',
      entity: 'UserPermission',
      entityId: userMap.get('renato.farias@verttexloja.com.br'),
      oldValues: { effect: 'allow' },
      newValues: { effect: 'deny', permission: 'roles.read' },
      ipAddress: '201.86.55.10',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    },
    {
      userId: lucasUserId,
      action: 'store.user.add',
      entity: 'StoreUser',
      entityId: 'su_link_04',
      oldValues: null,
      newValues: { store: 'Cafés da Serra', user: 'Gabriel Cafés' },
      ipAddress: '189.40.12.98',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      userId: adminUserId,
      action: 'user.create',
      entity: 'User',
      entityId: userMap.get('thiago.martins@verttexloja.com.br'),
      oldValues: null,
      newValues: { name: 'Thiago Martins', role: 'store_manager' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
    {
      userId: adminUserId,
      action: 'system.config.update',
      entity: 'System',
      entityId: 'sys_config_jwt',
      oldValues: { ttl: '15m' },
      newValues: { ttl: '30m' },
      ipAddress: '177.136.14.22',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    },
  ]

  // Clear existing audit logs to avoid duplicate test noise, then populate
  await prisma.auditLog.deleteMany({})
  for (const log of auditEvents) {
    await prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        oldValues: log.oldValues ? JSON.parse(JSON.stringify(log.oldValues)) : undefined,
        newValues: log.newValues ? JSON.parse(JSON.stringify(log.newValues)) : undefined,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      },
    })
  }
  console.log(`✅ ${auditEvents.length} audit log entries seeded.`)

  // Seed Categories
  const catQueijos = await prisma.category.upsert({
    where: { slug: 'queijos-artesanais' },
    update: {},
    create: {
      name: 'Queijos Artesanais',
      slug: 'queijos-artesanais',
      description: 'Queijos finos e artesanais produzidos em regiões tradicionais',
      position: 1,
      status: 'active',
      isVisible: true,
    },
  })

  await prisma.category.upsert({
    where: { slug: 'queijo-canastra' },
    update: {},
    create: {
      name: 'Queijo Canastra',
      slug: 'queijo-canastra',
      description: 'Queijos curados e meia-cura da região da Canastra',
      parentId: catQueijos.id,
      position: 1,
      status: 'active',
      isVisible: true,
    },
  })

  await prisma.category.upsert({
    where: { slug: 'doces-e-geleias' },
    update: {},
    create: {
      name: 'Doces & Geleias',
      slug: 'doces-e-geleias',
      description: 'Doces de leite, geleias de frutas nativas e compotas tradicionais',
      position: 2,
      status: 'active',
      isVisible: true,
    },
  })

  // Seed Brands
  await prisma.brand.upsert({
    where: { slug: 'queijaria-serra-da-canastra' },
    update: {},
    create: {
      name: 'Queijaria Serra da Canastra',
      slug: 'queijaria-serra-da-canastra',
      description: 'Produtor tradicional da Serra da Canastra',
      status: 'active',
      isVisible: true,
    },
  })

  await prisma.brand.upsert({
    where: { slug: 'alvorada-artesanal' },
    update: {},
    create: {
      name: 'Alvorada Artesanal',
      slug: 'alvorada-artesanal',
      description: 'Doces e compotas artesanais',
      status: 'active',
      isVisible: true,
    },
  })

  console.log('✅ Categorias e marcas iniciais semeadas com sucesso.')

  console.log('🎉 Seed finished successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

