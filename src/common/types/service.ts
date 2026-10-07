import type {
  ActivityType,
  AttendanceStatus,
  EnrollmentStatus,
} from "@/db/schema";

export interface Member {
  id: string;
  name: string;
  email: string;
  userId: string;
  organizationId: string;
  role: string;
}

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
  parents: Parent[];
}

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

export interface ChildrenCentre {
  name: string;
  id: string;
  location: string;
}
