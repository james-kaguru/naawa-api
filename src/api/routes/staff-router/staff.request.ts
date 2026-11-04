import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

export const childrenCentreStaffParamsSchema = z.object({
  childrenCentreId: z.uuid(),
});

export type ChildrenCentreStaffParamsSchema = z.infer<
  typeof childrenCentreStaffParamsSchema
>;

export const staffParamsSchema = childrenCentreStaffParamsSchema.extend({
  id: z.uuid(),
});

export type StaffParamsSchema = z.infer<typeof staffParamsSchema>;

export const createStaffSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().trim().min(1),
  password: z.string().trim(),
  organizationRoleId: z.string(),
});

export type CreateStaffSchema = z.infer<typeof createStaffSchema>;

export const findStaffSchema = paginationQuerySchema.extend({
  name: z.string().optional(),
});

export type FindStaffSchema = z.infer<typeof findStaffSchema>;
