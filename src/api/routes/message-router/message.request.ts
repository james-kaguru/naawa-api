import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

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
