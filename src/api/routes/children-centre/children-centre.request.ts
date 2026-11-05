import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const childrenCentreParamsSchema = z.object({
  id: z.uuid(),
});

export type ChildrenCentreParamsSchema = z.infer<typeof childrenCentreParamsSchema>;

export const createChildrenCentreSchema = z.object({
  name: z.string().trim().min(2),
  location: z.string().trim().min(2),
});

export type CreateChildrenCentreSchema = z.infer<typeof createChildrenCentreSchema>;

export const updateChildrenCentreSchema = z.object({
  name: z.string().trim().min(2).optional(),
  location: z.string().trim().min(2).optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
  message: "At least one field must be provided",
});

export type UpdateChildrenCentreSchema = z.infer<typeof updateChildrenCentreSchema>;

export const findChildrenCentresSchema = paginationQuerySchema.extend({
  name: z.string().optional(),
  location: z.string().optional(),
})

export type FindChildrenCentresSchema = z.infer<typeof findChildrenCentresSchema>;
