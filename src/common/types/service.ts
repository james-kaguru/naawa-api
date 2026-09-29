export interface Parent {
    id: string;
    name: string;
    email: string;
    memberId: string;
    phoneNumber: string;
    address: string | null;
    emergencyContact: string | null;
}

export interface ChildrenCentre {
    name: string;
    id: string;
    location: string;
}
