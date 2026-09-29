import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";
import { activityType } from "@/db/schema";

const activityTypeSchema = z.enum(activityType.enumValues);

export const childrenCentreActivitiesParamsSchema = z.object({
  childrenCentreId: z.uuid(),
});

export type ChildrenCentreActivitiesParamsSchema = z.infer<typeof childrenCentreActivitiesParamsSchema>;

export const activityParamsSchema = childrenCentreActivitiesParamsSchema.extend({
  id: z.uuid(),
});

export type ActivityParamsSchema = z.infer<typeof activityParamsSchema>;

export const createActivitySchema = z.object({
  childId: z.uuid(),
  type: activityTypeSchema,
  description: z.string().trim().min(1),
  details: z.record(z.string(), z.unknown()),
});

export type CreateActivitySchema = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  type: activityTypeSchema.optional(),
  description: z.string().trim().min(1).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
  message: "At least one field must be provided",
});

export type UpdateActivitySchema = z.infer<typeof updateActivitySchema>;

export const findActivitiesSchema = paginationQuerySchema.extend({
  attendanceId: z.uuid().optional(),
  childId: z.uuid().optional(),
  type: activityTypeSchema.optional(),
  date: z.iso.date().optional(),
})

export type FindActivitiesSchema = z.infer<typeof findActivitiesSchema>;
