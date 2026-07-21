import { AbilityBuilder } from '@casl/ability'
import { AppAbility } from '.'
import { Role } from './roles'
import { Action, Subject } from './subjects'

export interface UserPermissionOverride {
  permissionKey: string
  effect: 'allow' | 'deny'
}

export interface UserToken {
  id: string
  role: Role
  rolePermissions?: string[]
  permissions?: UserPermissionOverride[]
}

export const PERMISSION_MAP: Record<
  string,
  { action: Action; subject: Subject }
> = {
  'users.read': { action: 'read', subject: 'User' },
  'users.create': { action: 'create', subject: 'User' },
  'users.update': { action: 'update', subject: 'User' },
  'users.delete': { action: 'delete', subject: 'User' },

  'roles.read': { action: 'read', subject: 'Role' },
  'roles.create': { action: 'create', subject: 'Role' },
  'roles.update': { action: 'update', subject: 'Role' },
  'roles.delete': { action: 'delete', subject: 'Role' },

  'permissions.read': { action: 'read', subject: 'Permission' },
  'permissions.manage': { action: 'manage', subject: 'Permission' },

  'stores.read': { action: 'read', subject: 'Store' },
  'stores.create': { action: 'create', subject: 'Store' },
  'stores.update': { action: 'update', subject: 'Store' },
  'stores.delete': { action: 'delete', subject: 'Store' },
  'stores.manage-members': { action: 'manage-members', subject: 'Store' },

  'products.read': { action: 'read', subject: 'Product' },
  'products.create': { action: 'create', subject: 'Product' },
  'products.update': { action: 'update', subject: 'Product' },
  'products.delete': { action: 'delete', subject: 'Product' },

  'inventory.read': { action: 'read', subject: 'Inventory' },
  'inventory.update': { action: 'update', subject: 'Inventory' },

  'sales.read': { action: 'read', subject: 'Sale' },
  'reports.read': { action: 'read', subject: 'Report' },

  'audit.read': { action: 'read', subject: 'AuditLog' },
}

export function parsePermissionKey(
  key: string
): { action: Action; subject: Subject } | null {
  if (PERMISSION_MAP[key]) {
    return PERMISSION_MAP[key]
  }
  const [resource, act] = key.split('.')
  if (!resource || !act) return null

  const subjectName = (resource.charAt(0).toUpperCase() +
    resource.slice(1)) as Subject
  return { action: act as Action, subject: subjectName }
}

export function buildUserAbilities(
  user: UserToken,
  builder: AbilityBuilder<AppAbility>
): void {
  const { can, cannot } = builder

  // 1. Admin always has full access
  if (user.role === 'admin') {
    can('manage', 'all')
    return
  }

  // Collect role permissions
  const grantedRolePermissions = new Set<string>(user.rolePermissions || [])

  // Default permissions if rolePermissions array is not provided
  if (!user.rolePermissions) {
    if (user.role === 'employee' || user.role === 'supplier') {
      grantedRolePermissions.add('stores.read')
      grantedRolePermissions.add('inventory.read')
      grantedRolePermissions.add('sales.read')
      grantedRolePermissions.add('reports.read')
      if (user.role === 'employee') {
        grantedRolePermissions.add('stores.update')
        grantedRolePermissions.add('users.read')
      }
    }
  }

  // Process role default permissions
  for (const permKey of grantedRolePermissions) {
    const parsed = parsePermissionKey(permKey)
    if (parsed) {
      can(parsed.action, parsed.subject)
    }
  }

  // 2. Individual user overrides (grant / deny)
  if (user.permissions && Array.isArray(user.permissions)) {
    // Process allows first
    for (const override of user.permissions) {
      if (override.effect === 'allow') {
        const parsed = parsePermissionKey(override.permissionKey)
        if (parsed) {
          can(parsed.action, parsed.subject)
        }
      }
    }

    // Process explicit denies (denies always override allows)
    for (const override of user.permissions) {
      if (override.effect === 'deny') {
        const parsed = parsePermissionKey(override.permissionKey)
        if (parsed) {
          cannot(parsed.action, parsed.subject)
        }
      }
    }
  }
}
