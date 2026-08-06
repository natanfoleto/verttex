import { FastifyReply } from 'fastify'

import { FastifyZodRequest } from '../../@types/fastify'
import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { CepService } from '../../shared/services/cep.service'
import {
  CreateAddressBody,
  UpdateAddressBody,
  UpdateCustomerProfileBody,
} from './customer-addresses.schemas'
import { CustomerAddressesService } from './customer-addresses.service'
import { PersonalizationIdentityService } from './personalization-identity.service'

function getCustomerId(req: FastifyZodRequest): string {
  const customerId = req.customerPayload?.id || req.customer?.id
  if (!customerId) {
    throw new AppError('UNAUTHORIZED', 'Não autenticado', 401)
  }
  return customerId
}

export async function lookupCepController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = req.params as { zipCode: string }
  const result = await CepService.lookup(params.zipCode)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function listAddressesController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req)
  const addresses =
    await CustomerAddressesService.listCustomerAddresses(customerId)
  return reply.status(200).send({
    success: true,
    data: addresses,
  })
}

export async function createAddressController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req)
  const body = req.body as CreateAddressBody
  const address = await CustomerAddressesService.createCustomerAddress(
    customerId,
    body,
  )
  return reply.status(201).send({
    success: true,
    data: address,
  })
}

export async function getAddressDetailsController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req)
  const params = req.params as { id: string }
  const address = await CustomerAddressesService.getCustomerAddressDetails(
    customerId,
    params.id,
  )
  return reply.status(200).send({
    success: true,
    data: address,
  })
}

export async function updateAddressController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req)
  const params = req.params as { id: string }
  const body = req.body as UpdateAddressBody
  const address = await CustomerAddressesService.updateCustomerAddress(
    customerId,
    params.id,
    body,
  )
  return reply.status(200).send({
    success: true,
    data: address,
  })
}

export async function setDefaultAddressController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req)
  const params = req.params as { id: string }
  const address = await CustomerAddressesService.setDefaultCustomerAddress(
    customerId,
    params.id,
  )
  return reply.status(200).send({
    success: true,
    data: address,
  })
}

export async function deleteAddressController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req)
  const params = req.params as { id: string }
  const result = await CustomerAddressesService.deleteCustomerAddress(
    customerId,
    params.id,
  )
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function updateCustomerProfileExtendedController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req)
  const body = req.body as UpdateCustomerProfileBody
  const { name, phone, cpfCnpj, birthDate } = body

  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
      ...(cpfCnpj !== undefined ? { cpfCnpj: cpfCnpj || null } : {}),
      ...(birthDate !== undefined ? { birthDate } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpfCnpj: true,
      birthDate: true,
      status: true,
      createdAt: true,
    },
  })

  return reply.status(200).send({
    success: true,
    data: updatedCustomer,
  })
}

export async function mergeAnonymousSessionController(
  req: FastifyZodRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req)
  const result = await PersonalizationIdentityService.mergeAnonymousSession(
    customerId,
    req,
    reply,
  )

  return reply.status(200).send({
    success: true,
    data: result,
  })
}
