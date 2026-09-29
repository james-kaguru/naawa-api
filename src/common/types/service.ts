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

export interface ChildrenCentre {
    name: string;
    id: string;
    location: string;
}
