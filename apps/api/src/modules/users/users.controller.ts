import { FastifyReply } from 'fastify'
import { FastifyZodRequest } from '../../@types/fastify'
import { UsersService } from './users.service'
import {
  UserParams,
  UserQuery,
  CreateUserBody,
  UpdateUserBody,
  UpdateUserPermissionsBody,
} from './users.schemas'

const usersService = new UsersService()

export async function listUsersController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const query = request.query as UserQuery
  const result = await usersService.listUsers(query)
  return reply.send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}

export async function createUserController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const body = request.body as CreateUserBody
  const user = await usersService.createUser(body)
  return reply.status(201).send({
    success: true,
    data: user,
  })
}

export async function getUserController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as UserParams
  const user = await usersService.getUser(params.userId)
  return reply.send({
    success: true,
    data: user,
  })
}

export async function updateUserController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as UserParams
  const body = request.body as UpdateUserBody
  const user = await usersService.updateUser(params.userId, body)
  return reply.send({
    success: true,
    data: user,
  })
}

export async function deleteUserController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as UserParams
  const result = await usersService.deleteUser(params.userId)
  return reply.send({
    success: true,
    data: result,
  })
}

export async function getUserStoresController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as UserParams
  const stores = await usersService.getUserStores(params.userId)
  return reply.send({
    success: true,
    data: stores,
  })
}

export async function getUserPermissionsController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as UserParams
  const permissions = await usersService.getUserPermissions(params.userId)
  return reply.send({
    success: true,
    data: permissions,
  })
}

export async function updateUserPermissionsController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as UserParams
  const body = request.body as UpdateUserPermissionsBody
  const permissions = await usersService.updateUserPermissions(
    params.userId,
    body
  )
  return reply.send({
    success: true,
    data: permissions,
  })
}
