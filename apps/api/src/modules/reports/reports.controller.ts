import { FastifyReply, FastifyRequest } from "fastify";
import { ReportsService } from "./reports.service";
import { dateRangeQuerySchema, exportReportsQuerySchema } from "./reports.schemas";

export async function getSalesSummaryController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const query = dateRangeQuerySchema.parse(req.query);
  const result = await ReportsService.getSalesSummary(query);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function getTopProductsAndAbcController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const query = dateRangeQuerySchema.parse(req.query);
  const result = await ReportsService.getTopProductsAndAbc(query);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function getInventoryLossesReportController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const query = dateRangeQuerySchema.parse(req.query);
  const result = await ReportsService.getInventoryLossesReport(query);
  return reply.status(200).send({
    success: true,
    data: result,
  });
}

export async function exportReportController(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (req as any).userPayload?.id || (req as any).user?.id || "system";
  const query = exportReportsQuerySchema.parse(req.query);

  const result = await ReportsService.exportReport(userId, query);
  return reply
    .status(200)
    .header("Content-Type", result.contentType)
    .send(result.content);
}
