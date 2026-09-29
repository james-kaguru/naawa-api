import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const childParamsSchema = z.object({
  id: z.uuid(),
});

export type ChildParamsSchema = z.infer<typeof childParamsSchema>;

export const createChildSchema = z.object({
  parentId: z.uuid(),
  name: z.string().trim().min(2),
  dateOfBirth: z.iso.date(),
});

export type CreateChildSchema = z.infer<typeof createChildSchema>;

export const updateChildSchema = z.object({
  name: z.string().trim().min(2).optional(),
  dateOfBirth: z.iso.date().optional(),
  allergies: z.string().trim().optional(),
  specialInstructions: z.string().trim().optional(),
  medicalNotes: z.string().trim().optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
  message: "At least one field must be provided",
});

export type UpdateChildSchema = z.infer<typeof updateChildSchema>;

export const findChildrenSchema = paginationQuerySchema.extend({
  name: z.string().optional(),
  parentId: z.uuid().optional(),
})

export type FindChildrenSchema = z.infer<typeof findChildrenSchema>;

export const addChildParentSchema = z.object({
  parentId: z.uuid(),
});

export type AddChildParentSchema = z.infer<typeof addChildParentSchema>;
