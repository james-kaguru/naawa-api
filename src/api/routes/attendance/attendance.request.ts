import { paginationQuerySchema } from "@/api/schemas";
import { z } from "zod";
import { attendanceStatus } from "@/db/schema";

export const childrenCentreAttendancesParamsSchema = z.object({
  childrenCentreId: z.uuid(),
});

export type ChildrenCentreAttendancesParamsSchema = z.infer<typeof childrenCentreAttendancesParamsSchema>;

export const attendanceParamsSchema = childrenCentreAttendancesParamsSchema.extend({
  id: z.uuid(),
});

export type AttendanceParamsSchema = z.infer<typeof attendanceParamsSchema>;

export const checkInSchema = z.object({
  childIds: z.array(z.uuid()).min(1).refine((ids) => new Set(ids).size === ids.length, {
    message: "Child ids must be unique",
  }),
});

export type CheckInSchema = z.infer<typeof checkInSchema>;

export const findAttendancesSchema = paginationQuerySchema.extend({
  childId: z.uuid().optional(),
  status: z.enum(attendanceStatus.enumValues).optional(),
  date: z.iso.date().optional(),
})

export type FindAttendancesSchema = z.infer<typeof findAttendancesSchema>;

export const findChildAttendancesSchema = findAttendancesSchema.omit({ childId: true })

export type FindChildAttendancesSchema = z.infer<typeof findChildAttendancesSchema>;

export const findNotCheckedInChildrenSchema = paginationQuerySchema.extend({
  name: z.string().optional(),
  date: z.iso.date().default(() => new Date().toLocaleDateString("en-CA")),
})

export type FindNotCheckedInChildrenSchema = z.infer<typeof findNotCheckedInChildrenSchema>;
