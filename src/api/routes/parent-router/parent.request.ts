import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const createParentSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().trim(),
  phoneNumber: z.string().trim().startsWith("254").min(12).max(12),
  password: z.string().trim(),
});

export type CreateParentSchema = z.infer<typeof createParentSchema>;

export const updateParentSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    address: z.string().trim().optional(),
    phoneNumber: z.string().trim().startsWith("254").min(12).max(12).optional(),
    emergencyContact: z
      .string()
      .trim()
      .startsWith("254")
      .min(12)
      .max(12)
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateParentSchema = z.infer<typeof updateParentSchema>;

export const findParentsSchema = paginationQuerySchema.extend({
  name: z.string().optional(),
});

export type FindParentsSchema = z.infer<typeof findParentsSchema>;

export const createMyChildSchema = z.object({
  name: z.string().trim().min(2),
  dateOfBirth: z.iso.date(),
});

export type CreateMyChildSchema = z.infer<typeof createMyChildSchema>;

export const updateMyChildSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    dateOfBirth: z.iso.date().optional(),
    allergies: z.string().trim().optional(),
    specialInstructions: z.string().trim().optional(),
    medicalNotes: z.string().trim().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateMyChildSchema = z.infer<typeof updateMyChildSchema>;

export const parentParamsSchema = z.object({
  id: z.uuid(),
});

export type ParentParamsSchema = z.infer<typeof parentParamsSchema>;

export const parentChildrenParamsSchema = z.object({
  childId: z.uuid(),
});

export type ParentChildrenParamsSchema = z.infer<
  typeof parentChildrenParamsSchema
>;
