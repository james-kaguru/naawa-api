import { paginationQuerySchema } from "@/api/schemas";
import { senderType } from "@/db/schema";
import { z } from "zod";

export const childrenCentreThreadParamsSchema = z.object({
  childrenCentreId: z.uuid(),
});

export type ChildrenCentreThreadParamsSchema = z.infer<
  typeof childrenCentreThreadParamsSchema
>;

export const threadParamsSchema = childrenCentreThreadParamsSchema.extend({
  threadId: z.uuid(),
});

export type ThreadParamsSchema = z.infer<typeof threadParamsSchema>;

export const createThreadSchema = z.object({
  sender: z.enum(senderType.enumValues),
  parentId: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export type CreateThreadSchema = z.infer<typeof createThreadSchema>;

export const findThreadsSchema = paginationQuerySchema.extend({
  parentId: z.string().trim().min(1).optional(),
});

export type FindThreadsSchema = z.infer<typeof findThreadsSchema>;

export const findParentsThreadsSchema = paginationQuerySchema;

export type FindParentsThreadsSchema = z.infer<typeof findParentsThreadsSchema>;
