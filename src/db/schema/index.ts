import { date, integer, json, pgEnum, pgTable, text, time, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { account, invitation, member, organization, organizationRole, session, user, verification } from "./auth.schema";
import { defineRelationsPart } from "drizzle-orm";

export const parent = pgTable("parents", {
  id: uuid().primaryKey().defaultRandom(),
  memberId: text('member_id').notNull().references(() => member.id, {
     onDelete: 'restrict'
  }).unique(),
  name: text('name').notNull(),
  email: text('name').notNull().default(""),
  phoneNumber: text('phoneNumber').notNull().default(""),
  address: text('address').default(""),
  emergencyContact: text('emergencyContact').default(""),
});

export type ParentTable = typeof parent;

export const child = pgTable("children", {
  id: uuid().primaryKey().defaultRandom(),
  name: text('name').notNull(),
  dateOfBirth: date().notNull(),
  allergies: text('allergies').default(""),
  specialInstructions: text('specialInstructions').default(""),
  medicalNotes: text('medicalNotes').default(""),
});

export const childParent = pgTable("child_parents", {
  id: uuid().primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => child.id, { onDelete: 'restrict' }),
  parentId: uuid('parent_id').notNull().references(() => parent.id, { onDelete: 'restrict' }),
  timestamp: time().defaultNow(),
},
(t) => [
  unique('child_parents_child_id_parent_id_unique').on(t.childId,t.parentId)
]
);

export const childrenCentre = pgTable("children_centres", {
  id: uuid().primaryKey().defaultRandom(),
  name: text('name').notNull(),
  location: text('location').notNull(),
});

export const enrollmentStatus = pgEnum('enrollment_status', ['active', 'inactive']);

export const enrollment = pgTable("enrollments", {
  id: uuid().primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => child.id, { onDelete: 'restrict' }),
  childrenCentreId: uuid('child_center_id').notNull().references(() => childrenCentre.id, { onDelete: 'restrict' }),
  status: enrollmentStatus().notNull(),
  startDate: date().notNull(),
});

export const staff = pgTable("staff", {
  id: uuid().primaryKey().defaultRandom(),
  memberId: text('member_id').notNull().references(() => member.id, { onDelete: 'restrict' }).unique(),
  childrenCentreId: uuid('child_center_id').notNull().references(() => childrenCentre.id, { onDelete: 'restrict' }),
  timestamp: timestamp().defaultNow()
});

export const attendanceStatus = pgEnum('attendance_status', ['checkedIn', 'checkedOut']);

export const attendance = pgTable("attendances", {
  id: uuid().primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => enrollment.id, { onDelete: 'restrict' }),
  checkedInStaffId: uuid('checked_in_staff_id').notNull().references(() => staff.id, { onDelete: 'restrict' }),
  checkedOutStaffId: uuid('checked_out_staff_id').references(() => staff.id, { onDelete: 'restrict' }),
  status: attendanceStatus().notNull(),
  checkedInAt: timestamp().defaultNow(),
  checkedOutAt: timestamp(),
});

export const activityType = pgEnum('activity_type', ['meal', 'nap','incident','play','note']);

export const activity = pgTable("activities", {
  id: uuid().primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'restrict' }),
  attendanceId: uuid('attendance_id').notNull().references(() => attendance.id, { onDelete: 'restrict' }),
  type: activityType().notNull(),
  description: text().notNull().default(""),
  details: json().notNull().default({}),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});



export const dbRelations = defineRelationsPart({ parent, child, childrenCentre, enrollment, attendance, attendanceLog, incident, incidentLog, member, user, session, account, verification, organization, organizationRole, invitation }, (r) => ({
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

  // auth
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    members: r.many.member({
      from: r.user.id,
      to: r.member.userId,
    }),
    invitations: r.many.invitation({
      from: r.user.id,
      to: r.invitation.inviterId,
    })
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    })
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    })
  },
  organization: {
    organizationRoles: r.many.organizationRole({
      from: r.organization.id,
      to: r.organizationRole.organizationId,
    }),
    members: r.many.member({
      from: r.organization.id,
      to: r.member.organizationId,
    }),
    invitations: r.many.invitation({
      from: r.organization.id,
      to: r.invitation.organizationId,
    })
  },
  organizationRole: {
    organization: r.one.organization({
      from: r.organizationRole.organizationId,
      to: r.organization.id,
    })
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
      to: r.parent.memberId
    }),
    attendances: r.many.attendance({
      from: r.member.id,
      to: r.attendance.memberId,
    })
  },
  invitation: {
    organization: r.one.organization({
      from: r.invitation.organizationId,
      to: r.organization.id,
    }),
    user: r.one.user({
      from: r.invitation.inviterId,
      to: r.user.id,
    })
  }
}));
