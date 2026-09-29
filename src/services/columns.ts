// Relational query column selections, kept in sync with the response types in @/common/types

export const parentColumns = {
  id: true,
  name: true,
  email: true,
  memberId: true,
  phoneNumber: true,
  address: true,
  emergencyContact: true,
} as const

export const childColumns = {
  id: true,
  name: true,
  dateOfBirth: true,
  allergies: true,
  specialInstructions: true,
  medicalNotes: true,
} as const

export const childWith = {
  parents: {
    columns: parentColumns,
    orderBy: { name: "asc" },
  },
} as const

export const enrollmentColumns = {
  id: true,
  status: true,
  startDate: true,
} as const

export const enrollmentWith = {
  child: {
    columns: childColumns,
  },
} as const
