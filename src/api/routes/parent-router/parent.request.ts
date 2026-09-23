import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const createParentSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().trim(),
  password: z.string().trim(),
});

export type CreateParentSchema = z.infer<typeof createParentSchema>;

export const updateParentSchema = createParentSchema.pick({ name: true }).partial();

export type UpdateParentSchema = z.infer<typeof updateParentSchema>;

export const findParentsSchema = paginationQuerySchema.extend({
  name: z.string().optional(),
})

export type FindParentsSchema = z.infer<typeof findParentsSchema>;
