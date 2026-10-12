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

export const threadMessagesParamsSchema = z.object({
  threadId: z.uuid(),
});

export type ThreadMessagesParamsSchema = z.infer<typeof threadMessagesParamsSchema>;

export const createMessageSchema = z.object({
  body: z.string().trim().min(1),
});

export type CreateMessageSchema = z.infer<typeof createMessageSchema>;

export const findMessagesSchema = paginationQuerySchema;

export type FindMessagesSchema = z.infer<typeof findMessagesSchema>;
