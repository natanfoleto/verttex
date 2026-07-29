import { FastifyReply, FastifyRequest } from "fastify";
import { OrdersService } from "./orders.service";
import {
  cancelOrderBodySchema,
  checkoutBodySchema,
  listOrdersQuerySchema,
} from "./orders.schemas";

export class OrdersController {
  static async checkout(req: FastifyRequest, reply: FastifyReply) {
    const customerId = (req as any).customer.id;
    const body = checkoutBodySchema.parse(req.body);

    const order = await OrdersService.checkout(customerId, body);
    return reply.status(201).send(order);
  }

  static async listOrders(req: FastifyRequest, reply: FastifyReply) {
    const customerId = (req as any).customer.id;
    const query = listOrdersQuerySchema.parse(req.query);

    const result = await OrdersService.listCustomerOrders(customerId, query);
    return reply.send(result);
  }

  static async listManagerOrders(req: FastifyRequest, reply: FastifyReply) {
    const query = (req.query || {}) as {
      status?: string;
      search?: string;
      page?: string;
      limit?: string;
      perPage?: string;
    };
    const result = await OrdersService.listManagerOrders(query);
    return reply.send({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  static async getOrder(req: FastifyRequest, reply: FastifyReply) {
    const customerId = (req as any).customer.id;
    const { id } = req.params as { id: string };

    const order = await OrdersService.getOrderDetails(customerId, id);
    return reply.send(order);
  }

  static async cancelOrder(req: FastifyRequest, reply: FastifyReply) {
    const customerId = (req as any).customer.id;
    const { id } = req.params as { id: string };
    const body = cancelOrderBodySchema.parse(req.body || {});

    const order = await OrdersService.cancelOrder(customerId, id, body.cancelReason);
    return reply.send(order);
  }
}
