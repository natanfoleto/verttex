import { z } from "zod";

export const RoleSchema = z.union([z.literal("ADMIN"), z.literal("USER")]);

export type Role = z.infer<typeof RoleSchema>;
