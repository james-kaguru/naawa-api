import type { AttendanceStatus, EnrollmentStatus } from "@/db/schema";

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
  parents:Parent[]
}

export type PlainChild = Omit<Child,"parents">

export interface Enrollment {
  id: string;
  child: PlainChild;
  status: EnrollmentStatus;
  startDate: string;
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

export interface ChildrenCentre {
    name: string;
    id: string;
    location: string;
}
