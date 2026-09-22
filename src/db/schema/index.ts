import { date, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { member, user } from "./auth.schema";
import { defineRelationsPart } from "drizzle-orm";

export const parent = pgTable("parents", {
  id: uuid().primaryKey().notNull(),
  memberId: text('member_id').notNull().references(() => member.id),
  name: text('name').notNull(),
});

export const child = pgTable("children", {
  id: uuid().primaryKey().notNull(),
  parentId: text('parent_id').notNull().references(() => parent.id,),
  name: text('name').notNull(),
});

export const childrenCentre = pgTable("children_centres", {
  id: uuid().primaryKey().notNull(),
  name: text('name').notNull(),
  location: text('location').notNull(),
});

export const enrollmentStatus = pgEnum('enrolled', ['archived']);

export const enrollment = pgTable("enrollments", {
  id: uuid().primaryKey().notNull(),
  childId: text('child_id').notNull().references(() => child.id,),
  childrenCentre: text('child_center_id').notNull().references(() => childrenCentre.id,),
  status: enrollmentStatus().notNull(),
  startDate: date().notNull(),
  endDate: date(),
});

export const attendanceStatus = pgEnum('checkedIn', ['checkedOut']);

export const attendance = pgTable("attendances", {
  id: uuid().primaryKey().notNull(),
  enrollmentId: text('enrollment_id').notNull().references(() => enrollment.id),
  memberId: text('member_id').notNull().references(() => member.id),
  status: attendanceStatus().notNull(),
  signedInAt: timestamp().defaultNow(),
  signedOutAt: timestamp(),
});

export const attendanceLogAction = pgEnum('checkIn', ['checkOut']);

export const attendanceLog = pgTable("attendances", {
  id: uuid().primaryKey().notNull(),
  attendanceId: text('attendance_id').notNull().references(() => attendance.id),
  action: attendanceLogAction().notNull(),
  createdAt: timestamp().defaultNow(),
});

export const incident = pgTable("incidences", {
  id: uuid().primaryKey().notNull(),
  attendanceId: text('attendance_id').notNull().references(() => attendance.id),
  name: text('member_id').notNull().references(() => member.id),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});

export const incidentLog = pgTable("incident_logs", {
  id: uuid().primaryKey().notNull(),
  incidentId: text('incident_id').notNull().references(() => incident.id),
  details: attendanceLogAction().notNull(),
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
      from: r.childrenCentre.id,
      to: r.child.id
    })
  },
  childrenCentre: {
    enrollments: r.many.enrollment({
      from: r.childrenCentre.id,
      to: r.enrollment.id
    })
  },
  enrollment: {
    childrenCentre: r.one.childrenCentre({
      from: r.enrollment.id,
      to: r.childrenCentre.id
    }),
    child: r.one.child({
      from: r.enrollment.childId,
      to: r.child.id
    }),
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
  },
  attendanceLog: {
    attendance: r.one.attendance({
      from: r.attendanceLog.attendanceId,
      to: r.attendance.id
    }),
  },
  incident: {
    attendance: r.one.attendance({
      from: r.attendanceLog.attendanceId,
      to: r.attendance.id
    }),
  },
  incidentLog: {
    attendance: r.one.attendance({
      from: r.incidentLog.incidentId,
      to: r.incident.id
    }),
  },
}));
