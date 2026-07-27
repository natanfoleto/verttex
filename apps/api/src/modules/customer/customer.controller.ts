import { FastifyReply, FastifyRequest } from "fastify";
import { CepService } from "../../shared/services/cep.service";
import { prisma } from "../../infrastructure/database/prisma";
import { CustomerAddressesService } from "./customer-addresses.service";
import {
  CreateAddressBody,
  UpdateAddressBody,
  UpdateCustomerProfileBody,
} from "./customer-addresses.schemas";
import { AppError } from "../../shared/errors/app-error";

function getCustomerId(req: FastifyRequest): string {
  const customerId = (req as any).customerPayload?.id || (req as any).customer?.id;
  if (!customerId) {
    throw new AppError("UNAUTHORIZED", "Não autenticado", 401);
  }
  return customerId;
}

export async function lookupCepController(
  req: FastifyRequest<{ Params: { zipCode: string } }>,
  reply: FastifyReply,
) {
  const result = await CepService.lookup(req.params.zipCode);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function listAddressesController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req);
  const addresses = await CustomerAddressesService.listCustomerAddresses(customerId);
  return reply.status(200).send({
    success: true,
    data: addresses,
  });
}

export async function createAddressController(
  req: FastifyRequest<{ Body: CreateAddressBody }>,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req);
  const address = await CustomerAddressesService.createCustomerAddress(customerId, req.body);
  return reply.status(201).send({
    success: true,
    data: address,
  });
}

export async function getAddressDetailsController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req);
  const address = await CustomerAddressesService.getCustomerAddressDetails(
    customerId,
    req.params.id,
  );
  return reply.status(200).send({
    success: true,
    data: address,
  });
}

export async function updateAddressController(
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateAddressBody }>,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req);
  const address = await CustomerAddressesService.updateCustomerAddress(
    customerId,
    req.params.id,
    req.body,
  );
  return reply.status(200).send({
    success: true,
    data: address,
  });
}

export async function setDefaultAddressController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req);
  const address = await CustomerAddressesService.setDefaultCustomerAddress(
    customerId,
    req.params.id,
  );
  return reply.status(200).send({
    success: true,
    data: address,
  });
}

export async function deleteAddressController(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req);
  const result = await CustomerAddressesService.deleteCustomerAddress(
    customerId,
    req.params.id,
  );
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function updateCustomerProfileExtendedController(
  req: FastifyRequest<{ Body: UpdateCustomerProfileBody }>,
  reply: FastifyReply,
) {
  const customerId = getCustomerId(req);
  const { name, phone, cpfCnpj, birthDate } = req.body;

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
  });

  return reply.status(200).send({
    success: true,
    data: updatedCustomer,
  });
}
