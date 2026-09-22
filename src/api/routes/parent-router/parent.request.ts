import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const createParentSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().trim(),
  password: z.string().trim(),
  memberId: z.string().trim().min(2),
});

export type CreateParentSchema = z.infer<typeof createParentSchema>;


export const findParentsSchema = paginationQuerySchema.extend({
  name: z.string().optional(),
})

export type FindParentsSchema = z.infer<typeof findParentsSchema>;
