import { FastifyInstance } from 'fastify'
import { healthRoutes } from './health'
import { authUsersRoutes } from './auth-users/auth-users.routes'
import { authCustomersRoutes } from './auth-customers/auth-customers.routes'
import { customerRoutes } from './customer/customer.routes'
import { rolesRoutes } from './roles/roles.routes'
import { permissionsRoutes } from './permissions/permissions.routes'
import { usersRoutes } from './users/users.routes'
import { storesRoutes } from './stores/stores.routes'

export async function registerModules(app: FastifyInstance) {
  await app.register(healthRoutes)
  await app.register(authUsersRoutes, { prefix: '/auth/users' })
  await app.register(authCustomersRoutes, { prefix: '/auth/customers' })
  await app.register(customerRoutes, { prefix: '/customer' })
  await app.register(rolesRoutes)
  await app.register(permissionsRoutes)
  await app.register(usersRoutes)
  await app.register(storesRoutes)
}
