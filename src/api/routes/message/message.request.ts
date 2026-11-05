import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const messageParamsSchema = z.object({
  childrenCentreId: z.uuid(),
  threadId: z.uuid(),
});

export type MessageParamsSchema = z.infer<typeof messageParamsSchema>;

export const createMessageSchema = z.object({
  body: z.string().trim().min(1),
});

export type CreateMessageSchema = z.infer<typeof createMessageSchema>;

export const findMessagesSchema = paginationQuerySchema;

export type FindMessagesSchema = z.infer<typeof findMessagesSchema>;
