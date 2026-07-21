import { FastifyRequest, FastifyReply } from 'fastify'
import { Action, Subject } from '@verttex/auth'
import { AppError } from '../errors/app-error'

export function requirePermission(action: Action, subject: Subject) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.userPayload) {
      throw new AppError('UNAUTHORIZED', 'Não autenticado', 401)
    }

    const ability = request.getCurrentUserAbility()
    const canAccess = ability.can(action, subject as any)

    if (!canAccess) {
      throw new AppError(
        'FORBIDDEN',
        `Acesso negado. Requer permissão para ${action} em ${subject}`,
        403
      )
    }
  }
}
