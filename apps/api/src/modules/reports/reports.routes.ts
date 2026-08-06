import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import {
  exportReportController,
  getInventoryLossesReportController,
  getSalesSummaryController,
  getTopProductsAndAbcController,
} from './reports.controller'
import {
  dateRangeQuerySchema,
  exportReportsQuerySchema,
} from './reports.schemas'

export async function reportsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  // GET /reports/sales-summary — Protected for Management Users
  typedApp.get(
    '/sales-summary',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Reports & BI'],
        summary: 'Obter resumo executivo de vendas, faturamento e ticket médio',
        security: [{ bearerAuth: [] }],
        querystring: dateRangeQuerySchema,
      },
    },
    getSalesSummaryController,
  )

  // GET /reports/top-products — Protected for Management Users
  typedApp.get(
    '/top-products',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Reports & BI'],
        summary:
          'Obter ranking dos produtos mais vendidos e classificação na Curva ABC',
        security: [{ bearerAuth: [] }],
        querystring: dateRangeQuerySchema,
      },
    },
    getTopProductsAndAbcController,
  )

  // GET /reports/inventory-losses — Protected for Management Users
  typedApp.get(
    '/inventory-losses',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Reports & BI'],
        summary:
          'Obter relatório de perdas sanitárias de estoque (descartes por avaria/vencimento)',
        security: [{ bearerAuth: [] }],
        querystring: dateRangeQuerySchema,
      },
    },
    getInventoryLossesReportController,
  )

  // GET /reports/export — Protected for Management Users
  typedApp.get(
    '/export',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Reports & BI'],
        summary:
          'Exportar relatório de inteligência comercial em formato CSV ou JSON',
        security: [{ bearerAuth: [] }],
        querystring: exportReportsQuerySchema,
      },
    },
    exportReportController,
  )
}
