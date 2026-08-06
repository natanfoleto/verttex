import { FastifyReply } from 'fastify'

import { FastifyZodRequest } from '../../@types/fastify'
import { PermissionQuery } from './permissions.schemas'
import { PermissionsService } from './permissions.service'

const permissionsService = new PermissionsService()

export async function listPermissionsController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const query = request.query as PermissionQuery
  const permissions = await permissionsService.listPermissions(query)
  return reply.send({
    success: true,
    data: permissions,
  })
}
