import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const createParentSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().trim(),
  phoneNumber: z.string().trim().startsWith("254").min(12).max(12),
  password: z.string().trim(),
});

export type CreateParentSchema = z.infer<typeof createParentSchema>;

export const updateParentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  address: z.string().trim().optional(),
  phoneNumber: z.string().trim().startsWith("254").min(12).max(12).optional(),
  emergencyContact: z.string().trim().startsWith("254").min(12).max(12).optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
  message: "At least one field must be provided",
});

export type UpdateParentSchema = z.infer<typeof updateParentSchema>;

export const findParentsSchema = paginationQuerySchema.extend({
  name: z.string().optional(),
})

export type FindParentsSchema = z.infer<typeof findParentsSchema>;
