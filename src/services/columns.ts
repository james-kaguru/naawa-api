import { eq, sql, type SQL } from "drizzle-orm"
import type { AnyPgColumn } from "drizzle-orm/pg-core"
import { child, childrenCentre, parent, type ChildParentTable, type ParentTable } from "@/db/schema"
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

export const childSelect = {
  id: child.id,
  name: child.name,
  dateOfBirth: child.dateOfBirth,
  allergies: child.allergies,
  specialInstructions: child.specialInstructions,
  medicalNotes: child.medicalNotes,
}

export const staffSelect = <TStaff extends { id: AnyPgColumn }, TUser extends { name: AnyPgColumn }>(staffTable: TStaff, userTable: TUser): { id: TStaff["id"], name: TUser["name"] } => ({
  id: staffTable.id,
  name: userTable.name,
})

const childParentUserName = (table: ChildParentTable) =>
  sql<string>`(select ${user.name} from ${parent} inner join ${member} on ${eq(member.id, parent.memberId)} inner join ${user} on ${eq(user.id, member.userId)} where ${parent.id} = ${table.parentId})`

export const childWith = {
  childParents: {
    columns: { isBillingContact: true },
    with: {
      parent: {
        columns: parentColumns,
        extras: {
          name: (table: ParentTable): SQL<string> => parentUserField(table, user.name),
          email: (table: ParentTable): SQL<string> => parentUserField(table, user.email),
        },
      },
    },
    orderBy: (table: ChildParentTable) => childParentUserName(table),
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

export const childrenCentreColumns = {
  id: true,
  name: true,
  location: true,
} as const

export const childrenCentreSelect = {
  id: childrenCentre.id,
  name: childrenCentre.name,
  location: childrenCentre.location,
}

export const childEnrollmentWith = {
  childrenCentre: {
    columns: childrenCentreColumns,
  },
} as const
