import { Prisma } from '@prisma/client'

import type { AuthenticatedUserPayload } from '../../@types/fastify'
import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../errors/app-error'

export type StoreAccessActor = Pick<AuthenticatedUserPayload, 'id' | 'role'>

/**
 * Central authority for tenant boundaries.
 *
 * Functional permissions answer what an actor may do. This policy answers in
 * which stores that action is allowed. Both checks are required for protected
 * tenant resources.
 */
export class StoreAccessPolicy {
  static hasGlobalAccess(actor: StoreAccessActor): boolean {
    return actor.role === 'admin'
  }

  static async assertStoreAccess(
    actor: StoreAccessActor,
    storeId: string,
  ): Promise<void> {
    if (this.hasGlobalAccess(actor)) return

    const storeUser = await prisma.storeUser.findFirst({
      where: {
        storeId,
        userId: actor.id,
        isActive: true,
        store: { deletedAt: null },
      },
      select: { id: true },
    })

    if (!storeUser) {
      throw new AppError('FORBIDDEN', 'Você não possui acesso a esta loja', 403)
    }
  }

  /**
   * Returns undefined for a global administrator and an explicit Prisma
   * string filter for tenant-bound actors. An empty list intentionally yields
   * no rows.
   */
  static async resolveStoreFilter(
    actor: StoreAccessActor,
    requestedStoreId?: string | null,
  ): Promise<string | Prisma.StringFilter | undefined> {
    if (requestedStoreId) {
      await this.assertStoreAccess(actor, requestedStoreId)
      return requestedStoreId
    }

    const storeIds = await this.getAccessibleStoreIds(actor)
    return storeIds === null ? undefined : { in: storeIds }
  }

  /** Null represents unrestricted global scope. */
  static async getAccessibleStoreIds(
    actor: StoreAccessActor,
  ): Promise<string[] | null> {
    if (this.hasGlobalAccess(actor)) return null

    const links = await prisma.storeUser.findMany({
      where: {
        userId: actor.id,
        isActive: true,
        store: { deletedAt: null },
      },
      select: { storeId: true },
    })

    return links.map((link) => link.storeId)
  }
}
