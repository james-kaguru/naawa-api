import {
  boolean,
  check,
  date,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { member, organization, user } from "./auth.schema";
import { defineRelationsPart, sql } from "drizzle-orm";

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
    isBillingContact: boolean("is_billing_contact").notNull().default(false),
    timestamp: timestamp().defaultNow().notNull(),
  },
  (t) => [
    unique("child_parents_child_id_parent_id_unique").on(t.childId, t.parentId),
    uniqueIndex("child_parents_billing_contact_unique")
      .on(t.childId)
      .where(sql`${t.isBillingContact}`),
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
  childrenCentreId: uuid("children_centre_id")
    .notNull()
    .references(() => childrenCentre.id, {
      onDelete: "restrict",
    }),
  parentId: uuid("parent_id")
    .notNull()
    .references(() => parent.id, {
      onDelete: "restrict",
    }),
  createdAt: timestamp().defaultNow().notNull(),
});

export type ThreadTable = typeof thread;

export const senderType = pgEnum("senderType", ["parent", "staff"]);
export type SenderType = (typeof senderType.enumValues)[number];

export const message = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => thread.id, {
      onDelete: "restrict",
    }),
  senderType: senderType().notNull(),
  staffId: uuid("staff_id").references(() => staff.id, {
    onDelete: "restrict",
  }), // used as sender staff id / recipient staff id
  body: text().notNull(),
  readAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type MessageTable = typeof message;

export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);

export type InvoiceStatus = (typeof invoiceStatus.enumValues)[number];

export const invoice = pgTable(
  "invoices",
  {
    id: uuid().primaryKey().defaultRandom(),
    invoiceNumber: text("invoice_number").notNull(),
    childrenCentreId: uuid("children_centre_id")
      .notNull()
      .references(() => childrenCentre.id, { onDelete: "restrict" }),
    childId: uuid("child_id")
      .notNull()
      .references(() => child.id, { onDelete: "restrict" }),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parent.id, { onDelete: "restrict" }),
    status: invoiceStatus().notNull().default("draft"),
    currency: varchar({ length: 3 }).notNull(),
    subtotal: integer().notNull().default(0),
    tax: integer().notNull().default(0),
    total: integer().notNull().default(0),
    amountPaid: integer("amount_paid").notNull().default(0),
    notes: text().notNull().default(""),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    dueDate: date("due_date").notNull(),
    issuedAt: timestamp("issued_at"),
    paidAt: timestamp("paid_at"),
    voidedAt: timestamp("voided_at"),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("invoices_children_centre_id_invoice_number_unique").on(
      t.childrenCentreId,
      t.invoiceNumber,
    ),
    index("invoices_child_period_idx").on(t.childId, t.periodStart, t.periodEnd),
    index("invoices_parent_id_idx").on(t.parentId),
    check("invoices_period_valid", sql`${t.periodEnd} >= ${t.periodStart}`),
    check(
      "invoices_amounts_non_negative",
      sql`${t.subtotal} >= 0 AND ${t.tax} >= 0 AND ${t.total} >= 0 AND ${t.amountPaid} >= 0`,
    ),
  ],
);

export type InvoiceTable = typeof invoice;

export const invoiceItem = pgTable(
  "invoice_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "restrict" }),
    description: text().notNull(),
    quantity: integer().notNull().default(1),
    unitAmount: integer("unit_amount").notNull(),
    amount: integer().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (t) => [
    index("invoice_items_invoice_id_idx").on(t.invoiceId),
    check("invoice_items_quantity_positive", sql`${t.quantity} > 0`),
  ],
);

export type InvoiceItemTable = typeof invoiceItem;

export const billingRun = pgTable(
  "billing_runs",
  {
    id: uuid().primaryKey().defaultRandom(),
    childrenCentreId: uuid("children_centre_id")
      .notNull()
      .references(() => childrenCentre.id, { onDelete: "restrict" }),
    createdByStaffId: uuid("created_by_staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "restrict" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    dueDate: date("due_date").notNull(),
    currency: varchar({ length: 3 }).notNull(),
    description: text().notNull(),
    amount: integer().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (t) => [
    index("billing_runs_children_centre_period_idx").on(
      t.childrenCentreId,
      t.periodStart,
      t.periodEnd,
    ),
    check("billing_runs_period_valid", sql`${t.periodEnd} >= ${t.periodStart}`),
    check("billing_runs_amount_positive", sql`${t.amount} > 0`),
  ],
);

export type BillingRunTable = typeof billingRun;

export const billingRunItemOutcome = pgEnum("billing_run_item_outcome", [
  "created",
  "skipped",
  "failed",
]);

export type BillingRunItemOutcome =
  (typeof billingRunItemOutcome.enumValues)[number];

export const billingRunItem = pgTable(
  "billing_run_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    billingRunId: uuid("billing_run_id")
      .notNull()
      .references(() => billingRun.id, { onDelete: "restrict" }),
    childId: uuid("child_id")
      .notNull()
      .references(() => child.id, { onDelete: "restrict" }),
    invoiceId: uuid("invoice_id").references(() => invoice.id, {
      onDelete: "restrict",
    }),
    outcome: billingRunItemOutcome().notNull(),
    reason: text().notNull().default(""),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (t) => [
    unique("billing_run_items_billing_run_id_child_id_unique").on(
      t.billingRunId,
      t.childId,
    ),
    index("billing_run_items_invoice_id_idx").on(t.invoiceId),
    check(
      "billing_run_items_invoice_matches_outcome",
      sql`(${t.outcome} = 'failed') = (${t.invoiceId} IS NULL)`,
    ),
  ],
);

export type BillingRunItemTable = typeof billingRunItem;

export const transactionType = pgEnum("transaction_type", [
  "payment",
  "refund",
]);

export type TransactionType = (typeof transactionType.enumValues)[number];

export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "succeeded",
  "failed",
]);

export type TransactionStatus = (typeof transactionStatus.enumValues)[number];

export const paymentMethod = pgEnum("payment_method", [
  "mpesa",
  "card",
  "bankTransfer",
  "cash",
]);

export type PaymentMethod = (typeof paymentMethod.enumValues)[number];

export const transaction = pgTable(
  "transactions",
  {
    id: uuid().primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "restrict" }),
    type: transactionType().notNull(),
    status: transactionStatus().notNull().default("pending"),
    method: paymentMethod().notNull(),
    amount: integer().notNull(),
    currency: varchar({ length: 3 }).notNull(),
    provider: text().notNull().default(""),
    providerReference: text("provider_reference").notNull().default(""),
    failureReason: text("failure_reason").notNull().default(""),
    metadata: json().$type<Record<string, unknown>>().notNull().default({}),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("transactions_invoice_id_idx").on(t.invoiceId),
    uniqueIndex("transactions_provider_reference_unique")
      .on(t.provider, t.providerReference)
      .where(sql`${t.providerReference} <> ''`),
    check("transactions_amount_positive", sql`${t.amount} > 0`),
  ],
);

export type TransactionTable = typeof transaction;

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
    invoice,
    invoiceItem,
    billingRun,
    billingRunItem,
    transaction,
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
      invoices: r.many.invoice({
        from: r.parent.id,
        to: r.invoice.parentId,
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
      invoices: r.many.invoice({
        from: r.child.id,
        to: r.invoice.childId,
      }),
      billingRunItems: r.many.billingRunItem({
        from: r.child.id,
        to: r.billingRunItem.childId,
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
      invoices: r.many.invoice({
        from: r.childrenCentre.id,
        to: r.invoice.childrenCentreId,
      }),
      billingRuns: r.many.billingRun({
        from: r.childrenCentre.id,
        to: r.billingRun.childrenCentreId,
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
      billingRuns: r.many.billingRun({
        from: r.staff.id,
        to: r.billingRun.createdByStaffId,
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
    },
    invoice: {
      childrenCentre: r.one.childrenCentre({
        from: r.invoice.childrenCentreId,
        to: r.childrenCentre.id,
        optional: false,
      }),
      child: r.one.child({
        from: r.invoice.childId,
        to: r.child.id,
        optional: false,
      }),
      parent: r.one.parent({
        from: r.invoice.parentId,
        to: r.parent.id,
        optional: false,
      }),
      items: r.many.invoiceItem({
        from: r.invoice.id,
        to: r.invoiceItem.invoiceId,
      }),
      transactions: r.many.transaction({
        from: r.invoice.id,
        to: r.transaction.invoiceId,
      }),
      billingRunItems: r.many.billingRunItem({
        from: r.invoice.id,
        to: r.billingRunItem.invoiceId,
      }),
    },
    billingRun: {
      childrenCentre: r.one.childrenCentre({
        from: r.billingRun.childrenCentreId,
        to: r.childrenCentre.id,
        optional: false,
      }),
      createdBy: r.one.staff({
        from: r.billingRun.createdByStaffId,
        to: r.staff.id,
        optional: false,
      }),
      items: r.many.billingRunItem({
        from: r.billingRun.id,
        to: r.billingRunItem.billingRunId,
      }),
    },
    billingRunItem: {
      billingRun: r.one.billingRun({
        from: r.billingRunItem.billingRunId,
        to: r.billingRun.id,
        optional: false,
      }),
      child: r.one.child({
        from: r.billingRunItem.childId,
        to: r.child.id,
        optional: false,
      }),
      invoice: r.one.invoice({
        from: r.billingRunItem.invoiceId,
        to: r.invoice.id,
      }),
    },
    invoiceItem: {
      invoice: r.one.invoice({
        from: r.invoiceItem.invoiceId,
        to: r.invoice.id,
        optional: false,
      }),
    },
    transaction: {
      invoice: r.one.invoice({
        from: r.transaction.invoiceId,
        to: r.invoice.id,
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
