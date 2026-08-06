import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { logAudit } from '../../shared/utils/audit'
import {
  CreateAddressBody,
  UpdateAddressBody,
} from './customer-addresses.schemas'

export class CustomerAddressesService {
  /**
   * List all addresses for a customer ordered by default first, then createdAt
   */
  static async listCustomerAddresses(customerId: string) {
    return prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
  }

  /**
   * Create a new address for a customer.
   * If isDefault is true or this is the customer's first address, un-default all other addresses.
   */
  static async createCustomerAddress(
    customerId: string,
    body: CreateAddressBody,
  ) {
    const existingCount = await prisma.customerAddress.count({
      where: { customerId },
    })

    const shouldBeDefault = body.isDefault || existingCount === 0

    if (shouldBeDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      })
    }

    const created = await prisma.customerAddress.create({
      data: {
        customerId,
        label: body.label?.trim() || null,
        recipient: body.recipient.trim(),
        phone: body.phone?.trim() || null,
        zipCode: body.zipCode,
        street: body.street.trim(),
        number: body.number.trim(),
        complement: body.complement?.trim() || null,
        neighborhood: body.neighborhood.trim(),
        city: body.city.trim(),
        state: body.state.toUpperCase(),
        isDefault: shouldBeDefault,
      },
    })

    await logAudit({
      userId: customerId,
      action: 'CUSTOMER_ADDRESS_CREATE',
      entity: 'CustomerAddress',
      entityId: created.id,
      newValues: created,
    })

    return created
  }

  /**
   * Get single customer address by ID with tenant isolation
   */
  static async getCustomerAddressDetails(
    customerId: string,
    addressId: string,
  ) {
    const address = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    })

    if (!address) {
      throw new AppError(
        'NOT_FOUND',
        'Endereço não encontrado ou não pertence a este cliente',
        404,
      )
    }

    return address
  }

  /**
   * Update address with tenant isolation
   */
  static async updateCustomerAddress(
    customerId: string,
    addressId: string,
    body: UpdateAddressBody,
  ) {
    await this.getCustomerAddressDetails(customerId, addressId)

    if (body.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        ...(body.label !== undefined
          ? { label: body.label?.trim() || null }
          : {}),
        ...(body.recipient ? { recipient: body.recipient.trim() } : {}),
        ...(body.phone !== undefined
          ? { phone: body.phone?.trim() || null }
          : {}),
        ...(body.zipCode ? { zipCode: body.zipCode } : {}),
        ...(body.street ? { street: body.street.trim() } : {}),
        ...(body.number ? { number: body.number.trim() } : {}),
        ...(body.complement !== undefined
          ? { complement: body.complement?.trim() || null }
          : {}),
        ...(body.neighborhood
          ? { neighborhood: body.neighborhood.trim() }
          : {}),
        ...(body.city ? { city: body.city.trim() } : {}),
        ...(body.state ? { state: body.state.toUpperCase() } : {}),
        ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}),
      },
    })

    await logAudit({
      userId: customerId,
      action: 'CUSTOMER_ADDRESS_UPDATE',
      entity: 'CustomerAddress',
      entityId: addressId,
      newValues: body,
    })

    return updated
  }

  /**
   * Set address as default for customer
   */
  static async setDefaultCustomerAddress(
    customerId: string,
    addressId: string,
  ) {
    await this.getCustomerAddressDetails(customerId, addressId)

    await prisma.customerAddress.updateMany({
      where: { customerId },
      data: { isDefault: false },
    })

    const updated = await prisma.customerAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    })

    await logAudit({
      userId: customerId,
      action: 'CUSTOMER_ADDRESS_SET_DEFAULT',
      entity: 'CustomerAddress',
      entityId: addressId,
    })

    return updated
  }

  /**
   * Delete customer address
   */
  static async deleteCustomerAddress(customerId: string, addressId: string) {
    const address = await this.getCustomerAddressDetails(customerId, addressId)

    await prisma.customerAddress.delete({
      where: { id: addressId },
    })

    // If the deleted address was default, set another remaining address as default
    if (address.isDefault) {
      const remaining = await prisma.customerAddress.findFirst({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      })

      if (remaining) {
        await prisma.customerAddress.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        })
      }
    }

    await logAudit({
      userId: customerId,
      action: 'CUSTOMER_ADDRESS_DELETE',
      entity: 'CustomerAddress',
      entityId: addressId,
    })

    return { message: 'Endereço removido com sucesso' }
  }
}
