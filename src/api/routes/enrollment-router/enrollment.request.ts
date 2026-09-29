import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";

const enrollmentStatusSchema = z.enum(["active", "inactive"]);

export const childrenCentreEnrollmentsParamsSchema = z.object({
  childrenCentreId: z.uuid(),
});

export type ChildrenCentreEnrollmentsParamsSchema = z.infer<typeof childrenCentreEnrollmentsParamsSchema>;

export const enrollmentParamsSchema = childrenCentreEnrollmentsParamsSchema.extend({
  id: z.uuid(),
});

export type EnrollmentParamsSchema = z.infer<typeof enrollmentParamsSchema>;

export const createEnrollmentSchema = z.object({
  childId: z.uuid(),
  startDate: z.iso.date(),
});

export type CreateEnrollmentSchema = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentSchema = z.object({
  status: enrollmentStatusSchema.optional(),
  startDate: z.iso.date().optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
  message: "At least one field must be provided",
});

export type UpdateEnrollmentSchema = z.infer<typeof updateEnrollmentSchema>;

export const findEnrollmentsSchema = paginationQuerySchema.extend({
  childId: z.uuid().optional(),
  status: enrollmentStatusSchema.optional(),
})

export type FindEnrollmentsSchema = z.infer<typeof findEnrollmentsSchema>;
