import { FastifyReply } from 'fastify'
import { FastifyZodRequest } from '../../@types/fastify'
import { AuditService } from './audit.service'
import { AuditQuery } from './audit.schemas'

const auditService = new AuditService()

export async function listAuditLogsController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const query = request.query as AuditQuery
  const result = await auditService.listAuditLogs(query)
  return reply.send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}
