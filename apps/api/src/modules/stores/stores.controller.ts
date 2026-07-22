import { FastifyReply } from 'fastify'
import { FastifyZodRequest } from '../../@types/fastify'
import { StoresService } from './stores.service'
import {
  StoreParams,
  StoreQuery,
  CreateStoreBody,
  UpdateStoreBody,
  AddStoreMemberBody,
  StoreMemberParams,
} from './stores.schemas'

const storesService = new StoresService()

export async function createStoreController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userPayload = request.userPayload!
  const body = request.body as CreateStoreBody
  const store = await storesService.createStore(userPayload, body, request)
  return reply.status(201).send({
    success: true,
    data: store,
  })
}

export async function listStoresController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userPayload = request.userPayload!
  const query = request.query as StoreQuery
  const result = await storesService.listStores(userPayload, query)
  return reply.send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}

export async function getStoreController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as StoreParams
  const store = await storesService.getStore(params.storeId)
  return reply.send({
    success: true,
    data: store,
  })
}

export async function updateStoreController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userPayload = request.userPayload!
  const params = request.params as StoreParams
  const body = request.body as UpdateStoreBody
  const store = await storesService.updateStore(
    params.storeId,
    userPayload,
    body,
    request
  )
  return reply.send({
    success: true,
    data: store,
  })
}

export async function deleteStoreController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userPayload = request.userPayload!
  const params = request.params as StoreParams
  const result = await storesService.deleteStore(
    params.storeId,
    userPayload.id,
    request
  )
  return reply.send({
    success: true,
    data: result,
  })
}

export async function listStoreMembersController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as StoreParams
  const members = await storesService.listStoreMembers(params.storeId)
  return reply.send({
    success: true,
    data: members,
  })
}

export async function addStoreMemberController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as StoreParams
  const body = request.body as AddStoreMemberBody
  const actorId = request.userPayload?.id
  const member = await storesService.addStoreMember(
    params.storeId,
    body,
    actorId,
    request
  )
  return reply.status(201).send({
    success: true,
    data: member,
  })
}

export async function removeStoreMemberController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const params = request.params as StoreMemberParams
  const actorId = request.userPayload?.id
  const result = await storesService.removeStoreMember(
    params.storeId,
    params.userId,
    actorId,
    request
  )
  return reply.send({
    success: true,
    data: result,
  })
}
