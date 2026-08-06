import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { CepService } from '../../shared/services/cep.service'
import {
  validateCNPJ,
  validateCPF,
  validateCPForCNPJ,
} from '../../shared/utils/cpf-cnpj'
import { CustomerAddressesService } from './customer-addresses.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    customerAddress: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      update: vi.fn(),
    },
  },
}))

describe('Customer Profile & Addresses Unit & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CPF & CNPJ Checksum Validation', () => {
    it('should validate valid Brazilian CPF numbers using checksum algorithm', () => {
      // Valid CPF test cases
      expect(validateCPF('52998224725')).toBe(true)
      expect(validateCPF('529.982.247-25')).toBe(true)
      expect(validateCPF('11144477735')).toBe(true)

      // Invalid CPF test cases
      expect(validateCPF('00000000000')).toBe(false)
      expect(validateCPF('11111111111')).toBe(false)
      expect(validateCPF('12345678900')).toBe(false)
    })

    it('should validate valid Brazilian CNPJ numbers using checksum algorithm', () => {
      // Valid CNPJ test cases
      expect(validateCNPJ('11222333000181')).toBe(true)
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true)

      // Invalid CNPJ test cases
      expect(validateCNPJ('00000000000000')).toBe(false)
      expect(validateCNPJ('11111111111111')).toBe(false)
    })

    it('should validate combined CPF/CNPJ checker function', () => {
      expect(validateCPForCNPJ('52998224725')).toBe(true)
      expect(validateCPForCNPJ('11222333000181')).toBe(true)
      expect(validateCPForCNPJ('123')).toBe(false)
    })
  })

  describe('CEP Lookup Service Validation', () => {
    it('should throw validation error when CEP does not contain 8 digits', async () => {
      await expect(CepService.lookup('123')).rejects.toThrow(
        'CEP deve conter exatamente 8 dígitos numéricos',
      )
    })
  })

  describe('Customer Addresses Service Logic', () => {
    const mockCustomerId = 'cust-123'
    const mockAddressId = 'addr-999'

    const sampleAddressInput = {
      label: 'Casa',
      recipient: 'Natan Foleto',
      phone: '54999999999',
      zipCode: '95700000',
      street: 'Avenida Brasil',
      number: '100',
      complement: 'Apto 201',
      neighborhood: 'Centro',
      city: 'Bento Gonçalves',
      state: 'RS',
      isDefault: false,
    }

    it('should list customer addresses ordered by default first', async () => {
      vi.mocked(prisma.customerAddress.findMany).mockResolvedValue([
        {
          id: 'addr-1',
          ...sampleAddressInput,
          isDefault: true,
          customerId: mockCustomerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])

      const result =
        await CustomerAddressesService.listCustomerAddresses(mockCustomerId)

      expect(prisma.customerAddress.findMany).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      })
      expect(result).toHaveLength(1)
    })

    it('should automatically set first created address as default', async () => {
      vi.mocked(prisma.customerAddress.count).mockResolvedValue(0)
      vi.mocked(prisma.customerAddress.create).mockResolvedValue({
        id: mockAddressId,
        customerId: mockCustomerId,
        ...sampleAddressInput,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await CustomerAddressesService.createCustomerAddress(
        mockCustomerId,
        sampleAddressInput,
      )

      expect(prisma.customerAddress.updateMany).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId },
        data: { isDefault: false },
      })
      expect(result.isDefault).toBe(true)
    })

    it('should set new address as default and un-default previous addresses if isDefault is true', async () => {
      vi.mocked(prisma.customerAddress.count).mockResolvedValue(2)
      vi.mocked(prisma.customerAddress.create).mockResolvedValue({
        id: mockAddressId,
        customerId: mockCustomerId,
        ...sampleAddressInput,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await CustomerAddressesService.createCustomerAddress(
        mockCustomerId,
        { ...sampleAddressInput, isDefault: true },
      )

      expect(prisma.customerAddress.updateMany).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId },
        data: { isDefault: false },
      })
      expect(result.isDefault).toBe(true)
    })

    it('should set a specific address as default', async () => {
      vi.mocked(prisma.customerAddress.findFirst).mockResolvedValue({
        id: mockAddressId,
        customerId: mockCustomerId,
        ...sampleAddressInput,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      vi.mocked(prisma.customerAddress.update).mockResolvedValue({
        id: mockAddressId,
        customerId: mockCustomerId,
        ...sampleAddressInput,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await CustomerAddressesService.setDefaultCustomerAddress(
        mockCustomerId,
        mockAddressId,
      )

      expect(prisma.customerAddress.updateMany).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId },
        data: { isDefault: false },
      })
      expect(prisma.customerAddress.update).toHaveBeenCalledWith({
        where: { id: mockAddressId },
        data: { isDefault: true },
      })
      expect(result.isDefault).toBe(true)
    })

    it('should throw NOT_FOUND error when accessing non-existent or unowned address', async () => {
      vi.mocked(prisma.customerAddress.findFirst).mockResolvedValue(null)

      await expect(
        CustomerAddressesService.getCustomerAddressDetails(
          mockCustomerId,
          'invalid-id',
        ),
      ).rejects.toThrow(
        'Endereço não encontrado ou não pertence a este cliente',
      )
    })

    it('should delete address and re-assign default address to remaining address if default address was deleted', async () => {
      vi.mocked(prisma.customerAddress.findFirst)
        .mockResolvedValueOnce({
          id: mockAddressId,
          customerId: mockCustomerId,
          ...sampleAddressInput,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'addr-remaining',
          customerId: mockCustomerId,
          ...sampleAddressInput,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      await CustomerAddressesService.deleteCustomerAddress(
        mockCustomerId,
        mockAddressId,
      )

      expect(prisma.customerAddress.delete).toHaveBeenCalledWith({
        where: { id: mockAddressId },
      })
      expect(prisma.customerAddress.update).toHaveBeenCalledWith({
        where: { id: 'addr-remaining' },
        data: { isDefault: true },
      })
    })
  })
})
