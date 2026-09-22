import { date, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { member, user } from "./auth.schema";
import { defineRelationsPart } from "drizzle-orm";

export const parent = pgTable("parents", {
  id: uuid().primaryKey().defaultRandom(),
  memberId: text('member_id').notNull().references(() => member.id),
  name: text('name').notNull(),
});

export type ParentTable = typeof parent;

export const child = pgTable("children", {
  id: uuid().primaryKey().defaultRandom(),
  parentId: uuid('parent_id').notNull().references(() => parent.id,),
  name: text('name').notNull(),
});

export const childrenCentre = pgTable("children_centres", {
  id: uuid().primaryKey().defaultRandom(),
  name: text('name').notNull(),
  location: text('location').notNull(),
});

export const enrollmentStatus = pgEnum('enrollment_status', ['enrolled', 'archived']);

export const enrollment = pgTable("enrollments", {
  id: uuid().primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => child.id,),
  childrenCentreId: uuid('child_center_id').notNull().references(() => childrenCentre.id,),
  status: enrollmentStatus().notNull(),
  startDate: date().notNull(),
  endDate: date(),
});

export const attendanceStatus = pgEnum('attendance_status', ['checkedIn', 'checkedOut']);

export const attendance = pgTable("attendances", {
  id: uuid().primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollment.id),
  memberId: text('member_id').notNull().references(() => member.id),
  status: attendanceStatus().notNull(),
  signedInAt: timestamp().defaultNow(),
  signedOutAt: timestamp(),
});

export const attendanceLogAction = pgEnum('attendance_log_action', ['checkIn', 'checkOut']);

export const attendanceLog = pgTable("attendance_logs", {
  id: uuid().primaryKey().defaultRandom(),
  attendanceId: uuid('attendance_id').notNull().references(() => attendance.id),
  action: attendanceLogAction().notNull(),
  createdAt: timestamp().defaultNow(),
});

export const incident = pgTable("incidences", {
  id: uuid().primaryKey().defaultRandom(),
  attendanceId: uuid('attendance_id').notNull().references(() => attendance.id),
  memberId: text('member_id').notNull().references(() => member.id),
  description: text('description').notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});

export const incidentLog = pgTable("incident_logs", {
  id: uuid().primaryKey().defaultRandom(),
  incidentId: uuid('incident_id').notNull().references(() => incident.id),
  details: text('details').notNull(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});

export const dbRelations = defineRelationsPart({ parent, child, childrenCentre, enrollment, attendance, attendanceLog, incident, incidentLog, member }, (r) => ({
  parent: {
    member: r.one.member({
      from: r.parent.memberId,
      to: r.member.id,
    }),
    children: r.many.child({
      from: r.parent.id,
      to: r.child.parentId,
    })
  },
  member: {
    parent: r.one.parent({
      from: r.member.id,
      to: r.parent.memberId
    }),
    attendances: r.many.attendance({
      from: r.member.id,
      to: r.attendance.memberId,
    })
  },
  child: {
    parent: r.one.parent({
      from: r.child.parentId,
      to: r.parent.id
    }),
    enrollments: r.many.enrollment({
      from: r.child.id,
      to: r.enrollment.childId
    })
  },
  childrenCentre: {
    enrollments: r.many.enrollment({
      from: r.childrenCentre.id,
      to: r.enrollment.childrenCentreId
    })
  },
  enrollment: {
    childrenCentre: r.one.childrenCentre({
      from: r.enrollment.childrenCentreId,
      to: r.childrenCentre.id
    }),
    child: r.one.child({
      from: r.enrollment.childId,
      to: r.child.id
    }),
    attendances: r.many.attendance({
      from: r.enrollment.id,
      to: r.attendance.enrollmentId
    })
  },
  attendance: {
    enrollment: r.one.enrollment({
      from: r.attendance.enrollmentId,
      to: r.enrollment.id
    }),
    member: r.one.member({
      from: r.attendance.memberId,
      to: r.member.id
    }),
    incidences: r.many.incident({
      from: r.attendance.id,
      to: r.incident.attendanceId,
    }),
    attendanceLogs: r.many.attendanceLog({
      from: r.attendance.id,
      to: r.attendanceLog.attendanceId,
    }),
  },
  attendanceLog: {
    attendance: r.one.attendance({
      from: r.attendanceLog.attendanceId,
      to: r.attendance.id
    }),
  },
  incident: {
    attendance: r.one.attendance({
      from: r.incident.attendanceId,
      to: r.attendance.id
    }),
    incedentLogs: r.many.incidentLog({
      from: r.incident.id,
      to: r.incidentLog.incidentId,
    }),
  },
  incidentLog: {
    incident: r.one.incident({
      from: r.incidentLog.incidentId,
      to: r.incident.id
    }),
  },
}));
