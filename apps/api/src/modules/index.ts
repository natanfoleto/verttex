import { FastifyInstance } from 'fastify'

import { auditRoutes } from './audit/audit.routes'
import { authCustomersRoutes } from './auth-customers/auth-customers.routes'
import { authUsersRoutes } from './auth-users/auth-users.routes'
import { brandsRoutes } from './brands/brands.routes'
import {
  carouselPublicRoutes,
  carouselRoutes,
} from './carousel/carousel.routes'
import { cartRoutes } from './cart/cart.routes'
import { catalogRoutes } from './catalog/catalog.routes'
import { categoriesRoutes } from './categories/categories.routes'
import { customerRoutes } from './customer/customer.routes'
import { filesRoutes } from './files/files.routes'
import { healthRoutes } from './health'
import { lotsRoutes } from './lots/lots.routes'
import {
  marketplacePublicRoutes,
  marketplaceRoutes,
} from './marketplace/marketplace.routes'
import { notificationsRoutes } from './notifications/notifications.routes'
import { ordersRoutes } from './orders/orders.routes'
import { paymentsRoutes } from './payments/payments.routes'
import { permissionsRoutes } from './permissions/permissions.routes'
import { productsRoutes } from './products/products.routes'
import { reportsRoutes } from './reports/reports.routes'
import { returnsRoutes } from './returns/returns.routes'
import { reviewsRoutes } from './reviews/reviews.routes'
import { rolesRoutes } from './roles/roles.routes'
import { shippingRoutes } from './shipping/shipping.routes'
import { stockRoutes } from './stock/stock.routes'
import { storesRoutes } from './stores/stores.routes'
import { usersRoutes } from './users/users.routes'

export async function registerModules(app: FastifyInstance) {
  await app.register(healthRoutes)
  await app.register(authUsersRoutes, { prefix: '/auth/users' })
  await app.register(authCustomersRoutes, { prefix: '/auth/customers' })
  await app.register(customerRoutes, { prefix: '/customer' })
  await app.register(rolesRoutes)
  await app.register(permissionsRoutes)
  await app.register(usersRoutes)
  await app.register(storesRoutes)
  await app.register(auditRoutes)
  await app.register(categoriesRoutes, { prefix: '/categories' })
  await app.register(brandsRoutes, { prefix: '/brands' })
  await app.register(filesRoutes, { prefix: '/files' })
  await app.register(productsRoutes, { prefix: '/products' })
  await app.register(lotsRoutes, { prefix: '/lots' })
  await app.register(stockRoutes, { prefix: '/stock' })
  await app.register(catalogRoutes, { prefix: '/public/catalog' })
  await app.register(cartRoutes, { prefix: '/cart' })
  await app.register(ordersRoutes, { prefix: '/orders' })
  await app.register(paymentsRoutes, { prefix: '/payments' })
  await app.register(shippingRoutes, { prefix: '/shipping' })
  await app.register(returnsRoutes, { prefix: '/returns' })
  await app.register(reviewsRoutes, { prefix: '/reviews' })
  await app.register(notificationsRoutes, { prefix: '/notifications' })
  await app.register(reportsRoutes, { prefix: '/reports' })
  await app.register(marketplaceRoutes, { prefix: '/marketplace' })
  await app.register(marketplacePublicRoutes, { prefix: '/public/marketplace' })
  await app.register(carouselRoutes, { prefix: '/carousel' })
  await app.register(carouselPublicRoutes, { prefix: '/public/carousel' })
}
