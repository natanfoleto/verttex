import { FastifyInstance } from "fastify";
import { OrdersController } from "./orders.controller";

export async function ordersRoutes(app: FastifyInstance) {
  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", app.authenticateCustomer);

    protectedRoutes.post("/checkout", OrdersController.checkout);
    protectedRoutes.get("/", OrdersController.listOrders);
    protectedRoutes.get("/:id", OrdersController.getOrder);
    protectedRoutes.post("/:id/cancel", OrdersController.cancelOrder);
  });
}
