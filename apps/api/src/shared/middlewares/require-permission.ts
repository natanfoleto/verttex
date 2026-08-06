import { Action, Subject } from '@verttex/auth'
import { FastifyRequest } from 'fastify'

import { AppError } from '../errors/app-error'

export function requirePermission(action: Action, subject: Subject) {
  return async function (request: FastifyRequest) {
    if (!request.userPayload) {
      throw new AppError('UNAUTHORIZED', 'Não autenticado', 401)
    }

    const ability = request.getCurrentUserAbility()
    const canAccess = ability.can(
      action,
      subject as Parameters<typeof ability.can>[1],
    )

    if (!canAccess) {
      throw new AppError(
        'FORBIDDEN',
        `Acesso negado. Requer permissão para ${action} em ${subject}`,
        403,
      )
    }
  }
}
