import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health";
import { authUsersRoutes } from "./auth-users/auth-users.routes";
import { authCustomersRoutes } from "./auth-customers/auth-customers.routes";
import { customerRoutes } from "./customer/customer.routes";

export async function registerModules(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authUsersRoutes, { prefix: "/auth/users" });
  await app.register(authCustomersRoutes, { prefix: "/auth/customers" });
  await app.register(customerRoutes, { prefix: "/customer" });
}
