import { prisma } from '../../infrastructure/database/prisma'
import { AuditQuery } from './audit.schemas'

export class AuditService {
  async listAuditLogs(query: AuditQuery) {
    const page = Math.max(1, query.page || 1)
    const perPage = Math.max(1, Math.min(100, query.perPage || 20))
    const skip = (page - 1) * perPage

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (query.search) {
      const search = query.search.trim()
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { userAgent: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    if (query.userId) where.userId = query.userId
    if (query.action) where.action = query.action
    if (query.entity) where.entity = query.entity

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: { key: true, name: true },
              },
            },
          },
        },
      }),
    ])

    // Distinct values for filter dropdowns
    const [distinctActions, distinctEntities, users] = await Promise.all([
      prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      prisma.auditLog.findMany({
        distinct: ['entity'],
        select: { entity: true },
        orderBy: { entity: 'asc' },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
    ])

    const totalPages = Math.ceil(total / perPage)

    return {
      data: {
        logs,
        filters: {
          actions: distinctActions.map((a) => a.action),
          entities: distinctEntities.map((e) => e.entity),
          users,
        },
      },
      meta: {
        page,
        perPage,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    }
  }
}
