import { z } from "zod";
import { createApiSuccessSchema } from "@verttex/types";

export const healthResponseSchema = createApiSuccessSchema(
  z.object({
    status: z.string(),
    timestamp: z.string(),
  }),
);

export type HealthResponse = z.infer<typeof healthResponseSchema>;
