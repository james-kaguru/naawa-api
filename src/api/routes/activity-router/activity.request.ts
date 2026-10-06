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

export const mealDetailsSchema = z.strictObject({
  mealType: z.string().trim().min(1),
  portion: z.enum(["full", "half", "quarter", "none"]),
});

export type MealDetailsSchema = z.infer<typeof mealDetailsSchema>;

export const napDetailsSchema = z.strictObject({
  startTime: z.iso.datetime({ offset: true }).optional(),
});

export type NapDetailsSchema = z.infer<typeof napDetailsSchema>;

export const playDetailsSchema = z.strictObject({
  activity: z.string().trim().min(1),
  engagementLevel: z.enum(["excellent", "good", "distracted", "refused"]),
});

export type PlayDetailsSchema = z.infer<typeof playDetailsSchema>;

export const incidentDetailsSchema = z.strictObject({
  whatHappened: z.string().trim().min(1),
  actionsTaken: z.string().trim().min(1),
});

export type IncidentDetailsSchema = z.infer<typeof incidentDetailsSchema>;

export const noteDetailsSchema = z.strictObject({});

export type NoteDetailsSchema = z.infer<typeof noteDetailsSchema>;

const createActivityBaseSchema = z.strictObject({
  childId: z.uuid(),
  description: z.string().trim().min(1),
});

export const createActivitySchema = z.discriminatedUnion("type", [
  createActivityBaseSchema.extend({ type: z.literal("meal"), details: mealDetailsSchema }),
  createActivityBaseSchema.extend({ type: z.literal("nap"), details: napDetailsSchema.default({}) }),
  createActivityBaseSchema.extend({ type: z.literal("play"), details: playDetailsSchema }),
  createActivityBaseSchema.extend({ type: z.literal("incident"), details: incidentDetailsSchema }),
  createActivityBaseSchema.extend({ type: z.literal("note"), details: noteDetailsSchema.default({}) }),
]);

export type CreateActivitySchema = z.infer<typeof createActivitySchema>;

export const updateMealDetailsSchema = mealDetailsSchema.partial();

export const updateNapDetailsSchema = napDetailsSchema.extend({
  hasEnded: z.boolean().optional(),
});

export type UpdateNapDetailsSchema = z.infer<typeof updateNapDetailsSchema>;

export const updatePlayDetailsSchema = playDetailsSchema.partial();

export const updateIncidentDetailsSchema = incidentDetailsSchema.partial();

export const updateActivityDetailsSchemas = {
  meal: updateMealDetailsSchema,
  play: updatePlayDetailsSchema,
  incident: updateIncidentDetailsSchema,
  note: noteDetailsSchema,
};

export const updateActivitySchema = z.object({
  description: z.string().trim().min(1).optional(),
  details: z.union([
    updateMealDetailsSchema,
    updateNapDetailsSchema,
    updatePlayDetailsSchema,
    updateIncidentDetailsSchema,
  ]).optional(),
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
