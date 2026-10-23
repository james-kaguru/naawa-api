import {
  date,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { member, organization, user } from "./auth.schema";
import { defineRelationsPart } from "drizzle-orm";

export const parent = pgTable("parents", {
  id: uuid().primaryKey().defaultRandom(),
  memberId: text("member_id")
    .notNull()
    .references(() => member.id, {
      onDelete: "restrict",
    })
    .unique(),
  phoneNumber: text("phoneNumber").notNull(),
  address: text("address").notNull().default(""),
  emergencyContact: text("emergencyContact").notNull().default(""),
});

export type ParentTable = typeof parent;

export const child = pgTable("children", {
  id: uuid().primaryKey().defaultRandom(),
  name: text("name").notNull(),
  dateOfBirth: date().notNull(),
  allergies: text("allergies").notNull().default(""),
  specialInstructions: text("specialInstructions").notNull().default(""),
  medicalNotes: text("medicalNotes").notNull().default(""),
});

export type ChildTable = typeof child;

export const childParent = pgTable(
  "child_parents",
  {
    id: uuid().primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => child.id, { onDelete: "restrict" }),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parent.id, { onDelete: "restrict" }),
    timestamp: timestamp().defaultNow().notNull(),
  },
  (t) => [
    unique("child_parents_child_id_parent_id_unique").on(t.childId, t.parentId),
  ],
);

export type ChildParentTable = typeof childParent;

export const childrenCentre = pgTable("children_centres", {
  id: uuid().primaryKey().defaultRandom(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "restrict" })
    .unique(),
});

export type ChildrenCentreTable = typeof childrenCentre;

export const enrollmentStatus = pgEnum("enrollment_status", [
  "active",
  "inactive",
]);

export type EnrollmentStatus = (typeof enrollmentStatus.enumValues)[number];

export const enrollment = pgTable("enrollments", {
  id: uuid().primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => child.id, { onDelete: "restrict" }),
  childrenCentreId: uuid("child_center_id")
    .notNull()
    .references(() => childrenCentre.id, { onDelete: "restrict" }),
  status: enrollmentStatus().notNull(),
  startDate: date().notNull(),
});

export type EnrollmentTable = typeof enrollment;

export const staff = pgTable("staff", {
  id: uuid().primaryKey().defaultRandom(),
  memberId: text("member_id")
    .notNull()
    .references(() => member.id, { onDelete: "restrict" })
    .unique(),
  childrenCentreId: uuid("child_center_id")
    .notNull()
    .references(() => childrenCentre.id, { onDelete: "restrict" }),
  timestamp: timestamp().defaultNow().notNull(),
});

export type StaffTable = typeof staff;

export const attendanceStatus = pgEnum("attendance_status", [
  "checkedIn",
  "checkedOut",
]);

export type AttendanceStatus = (typeof attendanceStatus.enumValues)[number];

export const attendance = pgTable("attendances", {
  id: uuid().primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollment.id, { onDelete: "restrict" }),
  checkedInStaffId: uuid("checked_in_staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "restrict" }),
  checkedOutStaffId: uuid("checked_out_staff_id").references(() => staff.id, {
    onDelete: "restrict",
  }),
  status: attendanceStatus().notNull(),
  checkedInAt: timestamp().defaultNow().notNull(),
  checkedOutAt: timestamp(),
});

export type AttendanceTable = typeof attendance;

export const activityType = pgEnum("activity_type", [
  "meal",
  "nap",
  "incident",
  "play",
  "note",
]);

export type ActivityType = (typeof activityType.enumValues)[number];

export const activity = pgTable("activities", {
  id: uuid().primaryKey().defaultRandom(),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "restrict" }),
  attendanceId: uuid("attendance_id")
    .notNull()
    .references(() => attendance.id, { onDelete: "restrict" }),
  type: activityType().notNull(),
  description: text().notNull().default(""),
  details: json().$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type ActivityTable = typeof activity;

export const thread = pgTable("threads", {
  id: uuid().primaryKey().defaultRandom(),
  childrenCentreId: text("children_centre_id")
    .notNull()
    .references(() => childrenCentre.id, {
      onDelete: "restrict",
    }),
  parentId: text("parent_id")
    .notNull()
    .references(() => parent.id, {
      onDelete: "restrict",
    }),
  createdAt: timestamp().defaultNow().notNull(),
});

export type ThreadTable = typeof thread;

export const sender = pgEnum("sender", ["parent", "staff"]);
export type Sender = (typeof sender.enumValues)[number];

export const message = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => thread.id, {
      onDelete: "restrict",
    }),
  sender: sender().notNull(),
  staffId: text("staff_id").references(() => staff.id, {
    onDelete: "restrict",
  }),
  parentId: text("parent_id")
    .notNull()
    .references(() => parent.id, {
      onDelete: "restrict",
    }),
  body: text().notNull(),
  readAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type MessageTable = typeof message;

export const dbRelations = defineRelationsPart(
  {
    parent,
    child,
    childParent,
    childrenCentre,
    enrollment,
    staff,
    attendance,
    activity,
    thread,
    message,
    member,
    organization,
    user,
  },
  (r) => ({
    parent: {
      member: r.one.member({
        from: r.parent.memberId,
        to: r.member.id,
        optional: false,
      }),
      childParents: r.many.childParent({
        from: r.parent.id,
        to: r.childParent.parentId,
      }),
      children: r.many.child({
        from: r.parent.id.through(r.childParent.parentId),
        to: r.child.id.through(r.childParent.childId),
      }),
      threads: r.many.thread({
        from: r.parent.id,
        to: r.thread.parentId,
      }),
      messages: r.many.message({
        from: r.parent.id,
        to: r.message.parentId,
      }),
    },
    child: {
      childParents: r.many.childParent({
        from: r.child.id,
        to: r.childParent.childId,
      }),
      parents: r.many.parent({
        from: r.child.id.through(r.childParent.childId),
        to: r.parent.id.through(r.childParent.parentId),
      }),
      enrollments: r.many.enrollment({
        from: r.child.id,
        to: r.enrollment.childId,
      }),
    },
    childParent: {
      child: r.one.child({
        from: r.childParent.childId,
        to: r.child.id,
        optional: false,
      }),
      parent: r.one.parent({
        from: r.childParent.parentId,
        to: r.parent.id,
        optional: false,
      }),
    },
    childrenCentre: {
      organization: r.one.organization({
        from: r.childrenCentre.organizationId,
        to: r.organization.id,
        optional: false,
      }),
      enrollments: r.many.enrollment({
        from: r.childrenCentre.id,
        to: r.enrollment.childrenCentreId,
      }),
      staff: r.many.staff({
        from: r.childrenCentre.id,
        to: r.staff.childrenCentreId,
      }),
      threads: r.many.thread({
        from: r.childrenCentre.id,
        to: r.thread.childrenCentreId,
      }),
    },
    enrollment: {
      child: r.one.child({
        from: r.enrollment.childId,
        to: r.child.id,
        optional: false,
      }),
      childrenCentre: r.one.childrenCentre({
        from: r.enrollment.childrenCentreId,
        to: r.childrenCentre.id,
        optional: false,
      }),
      attendances: r.many.attendance({
        from: r.enrollment.id,
        to: r.attendance.enrollmentId,
      }),
    },
    staff: {
      member: r.one.member({
        from: r.staff.memberId,
        to: r.member.id,
        optional: false,
      }),
      childrenCentre: r.one.childrenCentre({
        from: r.staff.childrenCentreId,
        to: r.childrenCentre.id,
        optional: false,
      }),
      checkIns: r.many.attendance({
        from: r.staff.id,
        to: r.attendance.checkedInStaffId,
        alias: "checked_in_staff",
      }),
      checkOuts: r.many.attendance({
        from: r.staff.id,
        to: r.attendance.checkedOutStaffId,
        alias: "checked_out_staff",
      }),
      activities: r.many.activity({
        from: r.staff.id,
        to: r.activity.staffId,
      }),
      messages: r.many.message({
        from: r.staff.id,
        to: r.message.staffId,
      }),
    },
    attendance: {
      enrollment: r.one.enrollment({
        from: r.attendance.enrollmentId,
        to: r.enrollment.id,
        optional: false,
      }),
      checkedInBy: r.one.staff({
        from: r.attendance.checkedInStaffId,
        to: r.staff.id,
        optional: false,
        alias: "checked_in_staff",
      }),
      checkedOutBy: r.one.staff({
        from: r.attendance.checkedOutStaffId,
        to: r.staff.id,
        alias: "checked_out_staff",
      }),
      activities: r.many.activity({
        from: r.attendance.id,
        to: r.activity.attendanceId,
      }),
    },
    activity: {
      staff: r.one.staff({
        from: r.activity.staffId,
        to: r.staff.id,
        optional: false,
      }),
      attendance: r.one.attendance({
        from: r.activity.attendanceId,
        to: r.attendance.id,
        optional: false,
      }),
    },
    thread: {
      childrenCentre: r.one.childrenCentre({
        from: r.thread.childrenCentreId,
        to: r.childrenCentre.id,
        optional: false,
      }),
      parent: r.one.parent({
        from: r.thread.parentId,
        to: r.parent.id,
        optional: false,
      }),
      messages: r.many.message({
        from: r.thread.id,
        to: r.message.threadId,
      }),
    },
    message: {
      thread: r.one.thread({
        from: r.message.threadId,
        to: r.thread.id,
        optional: false,
      }),
      staff: r.one.staff({
        from: r.message.staffId,
        to: r.staff.id,
      }),
      parent: r.one.parent({
        from: r.message.parentId,
        to: r.parent.id,
        optional: false,
      }),
    },
    member: {
      organization: r.one.organization({
        from: r.member.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({
        from: r.member.userId,
        to: r.user.id,
      }),
      parent: r.one.parent({
        from: r.member.id,
        to: r.parent.memberId,
      }),
      staff: r.one.staff({
        from: r.member.id,
        to: r.staff.memberId,
      }),
    },
  }),
);
