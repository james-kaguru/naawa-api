import type {
  ActivityType,
  AttendanceStatus,
  BillingRunItemOutcome,
  EnrollmentStatus,
  InvoiceStatus,
  SenderType,
} from "@/db/schema";

export interface Member {
  id: string;
  name: string;
  email: string;
  userId: string;
  organizationId: string;
  role: string;
}

export type Permissions = Record<string, string[]>;

export interface Parent {
  id: string;
  name: string;
  email: string;
  memberId: string;
  phoneNumber: string;
  address: string;
  emergencyContact: string;
}

export interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
  allergies: string;
  specialInstructions: string;
  medicalNotes: string;
  parents: ChildParent[];
}

export type ChildParent = Parent & {
  isBillingContact: boolean;
};

export type PlainChild = Omit<Child, "parents">;

export interface Enrollment {
  id: string;
  child: PlainChild;
  status: EnrollmentStatus;
  startDate: string;
}

export interface ChildEnrollment {
  id: string;
  status: EnrollmentStatus;
  startDate: string;
  childrenCentre: ChildrenCentre;
}

export interface Staff {
  id: string;
  name: string;
}

export interface Attendance {
  id: string;
  enrollmentId: string;
  status: AttendanceStatus;
  checkedInAt: Date;
  checkedOutAt: Date | null;
  child: PlainChild;
  checkedInBy: Staff;
  checkedOutBy: Staff | null;
}

export type ChildAttendance = Omit<Attendance, "child"> & {
  childrenCentre: ChildrenCentre;
};

export interface Activity {
  id: string;
  attendanceId: string;
  type: ActivityType;
  description: string;
  details: Record<string, unknown>;
  staff: Staff;
  createdAt: Date;
  updatedAt: Date;
}

export type ChildActivity = Activity & {
  childrenCentre: ChildrenCentre;
};

export interface ThreadMember {
  id: string;
  name: string;
}

export interface Thread {
  id: string;
  childrenCentre: ThreadMember;
  parent: ThreadMember;
  unreadCount: number;
  createdAt: Date;
}

export interface MessageParticipant {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  sender: MessageParticipant;
  recipient: MessageParticipant | null;
  body: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface ChildrenCentre {
  name: string;
  id: string;
  location: string;
}

export interface InvoiceParty {
  id: string;
  name: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

export interface PlainInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  notes: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  issuedAt: Date | null;
  paidAt: Date | null;
  voidedAt: Date | null;
  childrenCentre: InvoiceParty;
  child: InvoiceParty;
  parent: InvoiceParty;
  createdAt: Date;
  updatedAt: Date;
}

export type Invoice = PlainInvoice & {
  items: InvoiceItem[];
};

export interface OverlappingInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  total: number;
}

export interface BillingRunSummary {
  created: number;
  skipped: number;
  failed: number;
}

export interface PlainBillingRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  currency: string;
  description: string;
  amount: number;
  createdBy: Staff;
  summary: BillingRunSummary;
  createdAt: Date;
}

export interface BillingRunInvoice {
  id: string;
  invoiceNumber: string;
}

export interface BillingRunItem {
  id: string;
  child: InvoiceParty;
  outcome: BillingRunItemOutcome;
  invoice: BillingRunInvoice | null;
  reason: string;
}

export type BillingRun = PlainBillingRun & {
  items: BillingRunItem[];
};
