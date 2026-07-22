import { FastifyReply } from 'fastify'
import { FastifyZodRequest } from '../../@types/fastify'
import { RolesService } from './roles.service'
import {
  RoleParams,
  RoleQuery,
  CreateRoleBody,
  UpdateRoleBody,
  UpdateRolePermissionsBody,
} from './roles.schemas'

const rolesService = new RolesService()

export async function listRolesController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const query = request.query as RoleQuery
  const result = await rolesService.listRoles(query)
  return reply.send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}

export async function createRoleController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const body = request.body as CreateRoleBody
  const actorId = request.userPayload?.id
  const role = await rolesService.createRole(body, actorId, request)
  return reply.status(201).send({
    success: true,
    data: role,
  })
}

export async function getRoleController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as RoleParams
  const role = await rolesService.getRole(params.roleId)
  return reply.send({
    success: true,
    data: role,
  })
}

export async function updateRoleController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as RoleParams
  const body = request.body as UpdateRoleBody
  const actorId = request.userPayload?.id
  const role = await rolesService.updateRole(params.roleId, body, actorId, request)
  return reply.send({
    success: true,
    data: role,
  })
}

export async function deleteRoleController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as RoleParams
  const actorId = request.userPayload?.id
  const result = await rolesService.deleteRole(params.roleId, actorId, request)
  return reply.send({
    success: true,
    data: result,
  })
}

export async function getRolePermissionsController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as RoleParams
  const permissions = await rolesService.getRolePermissions(params.roleId)
  return reply.send({
    success: true,
    data: permissions,
  })
}

export async function updateRolePermissionsController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as RoleParams
  const body = request.body as UpdateRolePermissionsBody
  const actorId = request.userPayload?.id
  const permissions = await rolesService.updateRolePermissions(
    params.roleId,
    body,
    actorId,
    request
  )
  return reply.send({
    success: true,
    data: permissions,
  })
}
