import { eq, sql, type SQL } from "drizzle-orm"
import type { ParentTable } from "@/db/schema"
import { member, user } from "@/db/schema/auth.schema"

const parentUserField = (table: ParentTable, field: typeof user.name | typeof user.email) =>
  sql<string>`(select ${field} from ${user} inner join ${member} on ${eq(member.userId, user.id)} where ${member.id} = ${table.memberId})`

export const parentColumns = {
  id: true,
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
    extras: {
      name: (table: ParentTable): SQL<string> => parentUserField(table, user.name),
      email: (table: ParentTable): SQL<string> => parentUserField(table, user.email),
    },
    orderBy: (table: ParentTable) => parentUserField(table, user.name),
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
