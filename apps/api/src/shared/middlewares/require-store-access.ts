import { FastifyRequest } from 'fastify'

import { AppError } from '../errors/app-error'
import { StoreAccessPolicy } from '../policies/store-access.policy'

export function requireStoreAccess(storeIdParam: string = 'storeId') {
  return async function (request: FastifyRequest) {
    if (!request.userPayload) {
      throw new AppError('UNAUTHORIZED', 'Não autenticado', 401)
    }

    const params = request.params as Record<string, string>
    const storeId = params[storeIdParam]

    if (!storeId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Identificador da loja não informado',
        400,
      )
    }

    await StoreAccessPolicy.assertStoreAccess(request.userPayload, storeId)
  }
}
