import { and, count, desc, eq, gte, lt, type SQL } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db, type Db } from "@/db"
import { attendance, child, enrollment, staff, type AttendanceTable } from "@/db/schema"
import { member, user } from "@/db/schema/auth.schema"
import NotFoundError from "@/common/errors/not-found.error"
import BadRequestError from "@/common/errors/bad-request.error"
import type { Attendance, PaginationServiceResponse } from "@/common/types"
import type { FindAttendancesSchema } from "@/api/routes/attendance-router"

export interface CheckIn {
  enrollmentId: string
  staffId: string
}

export interface CheckOut {
  staffId: string
}

export type FindAttendances = FindAttendancesSchema & {
  childrenCentreId: string
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
      child: {
        id: child.id,
        name: child.name,
        dateOfBirth: child.dateOfBirth,
        allergies: child.allergies,
        specialInstructions: child.specialInstructions,
        medicalNotes: child.medicalNotes,
      },
      checkedInBy: {
        id: checkedInStaff.id,
        name: checkedInUser.name,
      },
      checkedOutBy: {
        id: checkedOutStaff.id,
        name: checkedOutUser.name,
      },
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

  private toAttendance({ checkedOutBy, ...row }: Awaited<ReturnType<AttendanceService["select"]>>[number]): Attendance {
    return {
      ...row,
      checkedOutBy: checkedOutBy.id && checkedOutBy.name ? { id: checkedOutBy.id, name: checkedOutBy.name } : null,
    }
  }

  private filters({ childrenCentreId, childId, status, date }: Pick<FindAttendances, "childrenCentreId" | "childId" | "status" | "date">) {
    const filters: SQL[] = [eq(enrollment.childrenCentreId, childrenCentreId)]
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

  async checkIn({ enrollmentId, staffId }: CheckIn, childrenCentreId: string): Promise<Attendance> {
    const [open] = await this.db.select({ id: this.attendance.id })
      .from(this.attendance)
      .where(and(
        eq(this.attendance.enrollmentId, enrollmentId),
        eq(this.attendance.status, "checkedIn"),
      ))
      .limit(1)

    if (open) throw new BadRequestError(`Enrollment ${enrollmentId} is already checked in`)

    const [res] = await this.db.insert(this.attendance).values({
      enrollmentId,
      checkedInStaffId: staffId,
      status: "checkedIn",
    }).returning({ id: this.attendance.id })

    return this.findOne(res!.id, childrenCentreId)
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

  async findOne(id: string, childrenCentreId: string): Promise<Attendance> {
    const [res] = await this.select()
      .where(and(eq(this.attendance.id, id), eq(enrollment.childrenCentreId, childrenCentreId)))
      .limit(1)

    if (!res) throw new NotFoundError(`Attendance ${id} not found`)

    return this.toAttendance(res)
  }

}


export const attendanceService = new AttendanceService(db, attendance);
