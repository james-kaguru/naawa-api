import { and, count, desc, eq, gte, inArray, lt, or, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db, type Db } from "@/db"
import { attendance, child, childrenCentre, enrollment, staff, type AttendanceTable } from "@/db/schema"
import { member, user } from "@/db/schema/auth.schema"
import { NotFoundError, BadRequestError } from "@/common/errors"
import type { Attendance, ChildAttendance, PaginationServiceResponse, Staff } from "@/common/types"
import type { FindAttendancesSchema, FindChildAttendancesSchema } from "@/api/routes/attendance-router"
import { childSelect, childrenCentreSelect, staffSelect } from "./columns"

export interface CheckIn {
  enrollmentIds: string[]
  staffId: string
}

export interface CheckOut {
  staffId: string
}

export type FindAttendances = FindAttendancesSchema & {
  childrenCentreId: string
}

export type FindChildAttendances = FindChildAttendancesSchema & {
  childId: string
}

const checkedInStaff = alias(staff, "checked_in_staff")
const checkedInMember = alias(member, "checked_in_member")
const checkedInUser = alias(user, "checked_in_user")
const checkedOutStaff = alias(staff, "checked_out_staff")
const checkedOutMember = alias(member, "checked_out_member")
const checkedOutUser = alias(user, "checked_out_user")


export class AttendanceService {
  constructor(private db: Db, private attendance: AttendanceTable) {
  }

  private get columns() {
    return {
      id: this.attendance.id,
      enrollmentId: this.attendance.enrollmentId,
      status: this.attendance.status,
      checkedInAt: this.attendance.checkedInAt,
      checkedOutAt: this.attendance.checkedOutAt,
      child: childSelect,
      checkedInBy: staffSelect(checkedInStaff, checkedInUser),
      checkedOutBy: staffSelect(checkedOutStaff, checkedOutUser),
    }
  }

  private select() {
    return this.db.select(this.columns)
      .from(this.attendance)
      .innerJoin(enrollment, eq(enrollment.id, this.attendance.enrollmentId))
      .innerJoin(child, eq(child.id, enrollment.childId))
      .innerJoin(checkedInStaff, eq(checkedInStaff.id, this.attendance.checkedInStaffId))
      .innerJoin(checkedInMember, eq(checkedInMember.id, checkedInStaff.memberId))
      .innerJoin(checkedInUser, eq(checkedInUser.id, checkedInMember.userId))
      .leftJoin(checkedOutStaff, eq(checkedOutStaff.id, this.attendance.checkedOutStaffId))
      .leftJoin(checkedOutMember, eq(checkedOutMember.id, checkedOutStaff.memberId))
      .leftJoin(checkedOutUser, eq(checkedOutUser.id, checkedOutMember.userId))
  }

  private childSelect() {
    const { child: _child, ...columns } = this.columns

    return this.db.select({ ...columns, childrenCentre: childrenCentreSelect })
      .from(this.attendance)
      .innerJoin(enrollment, eq(enrollment.id, this.attendance.enrollmentId))
      .innerJoin(childrenCentre, eq(childrenCentre.id, enrollment.childrenCentreId))
      .innerJoin(checkedInStaff, eq(checkedInStaff.id, this.attendance.checkedInStaffId))
      .innerJoin(checkedInMember, eq(checkedInMember.id, checkedInStaff.memberId))
      .innerJoin(checkedInUser, eq(checkedInUser.id, checkedInMember.userId))
      .leftJoin(checkedOutStaff, eq(checkedOutStaff.id, this.attendance.checkedOutStaffId))
      .leftJoin(checkedOutMember, eq(checkedOutMember.id, checkedOutStaff.memberId))
      .leftJoin(checkedOutUser, eq(checkedOutUser.id, checkedOutMember.userId))
  }

  private toAttendance<TRow extends { checkedOutBy: { id: string | null, name: string | null } }>({ checkedOutBy, ...row }: TRow): Omit<TRow, "checkedOutBy"> & { checkedOutBy: Staff | null } {
    return {
      ...row,
      checkedOutBy: checkedOutBy.id && checkedOutBy.name ? { id: checkedOutBy.id, name: checkedOutBy.name } : null,
    }
  }

  private filters({ childrenCentreId, childId, status, date }: Pick<FindAttendances, "childId" | "status" | "date"> & { childrenCentreId?: string | undefined }) {
    const filters: SQL[] = []
    if (childrenCentreId) filters.push(eq(enrollment.childrenCentreId, childrenCentreId))
    if (childId) filters.push(eq(enrollment.childId, childId))
    if (status) filters.push(eq(this.attendance.status, status))
    if (date) {
      const start = new Date(`${date}T00:00:00`)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      filters.push(gte(this.attendance.checkedInAt, start), lt(this.attendance.checkedInAt, end))
    }

    return and(...filters)
  }

  async checkIn({ enrollmentIds, staffId }: CheckIn, childrenCentreId: string): Promise<Attendance[]> {
    const open = await this.db.select({ childId: enrollment.childId })
      .from(this.attendance)
      .innerJoin(enrollment, eq(enrollment.id, this.attendance.enrollmentId))
      .where(and(
        inArray(this.attendance.enrollmentId, enrollmentIds),
        eq(this.attendance.status, "checkedIn"),
      ))

    if (open.length) throw new BadRequestError(`Children ${open.map(({ childId }) => childId).join(", ")} are already checked in`)

    const res = await this.db.insert(this.attendance).values(enrollmentIds.map((enrollmentId) => ({
      enrollmentId,
      checkedInStaffId: staffId,
      status: "checkedIn" as const,
    }))).returning({ id: this.attendance.id })

    const data = await this.select()
      .where(and(inArray(this.attendance.id, res.map(({ id }) => id)), eq(enrollment.childrenCentreId, childrenCentreId)))
      .orderBy(child.name, this.attendance.id)

    return data.map((row) => this.toAttendance(row))
  }

  async checkOut(id: string, { staffId }: CheckOut, childrenCentreId: string): Promise<Attendance> {
    const current = await this.findOne(id, childrenCentreId)

    if (current.status === "checkedOut") throw new BadRequestError(`Attendance ${id} is already checked out`)

    await this.db.update(this.attendance)
      .set({
        status: "checkedOut",
        checkedOutStaffId: staffId,
        checkedOutAt: new Date(),
      })
      .where(and(eq(this.attendance.id, id), eq(this.attendance.status, "checkedIn")))

    return this.findOne(id, childrenCentreId)
  }

  async find({ page, perPage, paginate, ...filterValues }: FindAttendances): Promise<PaginationServiceResponse<Attendance>> {
    const where = this.filters(filterValues)

    const query = this.select()
      .where(where)
      .orderBy(desc(this.attendance.checkedInAt), desc(this.attendance.id))

    if (!paginate) {
      const data = (await query).map((row) => this.toAttendance(row))

      return {
        data,
        meta: { page: 1, perPage: data.length, totalPages: 1, totalCount: data.length },
      }
    }

    const [rows, [total]] = await Promise.all([
      query.limit(perPage).offset(perPage * (page - 1)),
      this.db.select({ totalCount: count() })
        .from(this.attendance)
        .innerJoin(enrollment, eq(enrollment.id, this.attendance.enrollmentId))
        .where(where),
    ])

    const totalCount = total?.totalCount ?? 0

    return {
      data: rows.map((row) => this.toAttendance(row)),
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findByChildId({ page, perPage, paginate, ...filterValues }: FindChildAttendances): Promise<PaginationServiceResponse<ChildAttendance>> {
    const where = this.filters(filterValues)

    const query = this.childSelect()
      .where(where)
      .orderBy(desc(this.attendance.checkedInAt), desc(this.attendance.id))

    if (!paginate) {
      const data = (await query).map((row) => this.toAttendance(row))

      return {
        data,
        meta: { page: 1, perPage: data.length, totalPages: 1, totalCount: data.length },
      }
    }

    const [rows, [total]] = await Promise.all([
      query.limit(perPage).offset(perPage * (page - 1)),
      this.db.select({ totalCount: count() })
        .from(this.attendance)
        .innerJoin(enrollment, eq(enrollment.id, this.attendance.enrollmentId))
        .where(where),
    ])

    const totalCount = total?.totalCount ?? 0

    return {
      data: rows.map((row) => this.toAttendance(row)),
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string, childrenCentreId: string): Promise<Attendance> {
    const [res] = await this.select()
      .where(and(eq(this.attendance.id, id), eq(enrollment.childrenCentreId, childrenCentreId)))
      .limit(1)

    if (!res) throw new NotFoundError(`Attendance ${id} not found`)

    return this.toAttendance(res)
  }

  async findOpenByChildId(childId: string, childrenCentreId: string): Promise<Attendance> {
    const [res] = await this.select()
      .where(and(
        eq(enrollment.childId, childId),
        eq(enrollment.childrenCentreId, childrenCentreId),
        eq(this.attendance.status, "checkedIn"),
      ))
      .limit(1)

    if (!res) throw new BadRequestError(`Child ${childId} is not checked in at children centre ${childrenCentreId}`)

    return this.toAttendance(res)
  }

  async findCheckedInChildIds(childrenCentreId: string, date: string): Promise<string[]> {
    const start = new Date(`${date}T00:00:00`)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const res = await this.db.selectDistinct({ childId: enrollment.childId })
      .from(this.attendance)
      .innerJoin(enrollment, eq(enrollment.id, this.attendance.enrollmentId))
      .where(and(
        eq(enrollment.childrenCentreId, childrenCentreId),
        or(
          eq(this.attendance.status, "checkedIn"),
          and(gte(this.attendance.checkedInAt, start), lt(this.attendance.checkedInAt, end)),
        ),
      ))

    return res.map(({ childId }) => childId)
  }

  async existsByStaffId(staffId: string): Promise<boolean> {
    const [res] = await this.db.select({ id: this.attendance.id })
      .from(this.attendance)
      .where(or(eq(this.attendance.checkedInStaffId, staffId), eq(this.attendance.checkedOutStaffId, staffId)))
      .limit(1)

    return !!res
  }
}


export const attendanceService = new AttendanceService(db, attendance);
