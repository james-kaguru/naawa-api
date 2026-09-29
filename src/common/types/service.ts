import type { EnrollmentStatus } from "@/db/schema";

export interface Parent {
    id: string;
    name: string;
    email: string;
    memberId: string;
    phoneNumber: string;
    address: string | null;
    emergencyContact: string | null;
}

export interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
  allergies: string | null;
  specialInstructions: string | null;
  medicalNotes: string | null;
  parents:Parent[]
}

export type PlainChild = Omit<Child,"parents">

export interface Enrollment {
  id: string;
  child: PlainChild;
  status: EnrollmentStatus;
  startDate: string;
}

export interface ChildrenCentre {
    name: string;
    id: string;
    location: string;
}
