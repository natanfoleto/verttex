import { z } from "zod";

export const userSubjectSchema = z.tuple([
  z.union([
    z.literal("manage"),
    z.literal("get"),
    z.literal("create"),
    z.literal("update"),
    z.literal("delete"),
  ]),
  z.union([z.literal("User"), z.literal("all")]),
]);

export type UserSubject = z.infer<typeof userSubjectSchema>;
