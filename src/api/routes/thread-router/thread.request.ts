import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const threadParamsSchema = z.object({
  id: z.uuid(),
});

export type ThreadParamsSchema = z.infer<typeof threadParamsSchema>;

export const createThreadSchema = z.object({
  memberId: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export type CreateThreadSchema = z.infer<typeof createThreadSchema>;

export const findThreadsSchema = paginationQuerySchema;

export type FindThreadsSchema = z.infer<typeof findThreadsSchema>;
