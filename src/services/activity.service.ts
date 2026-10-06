import { and, count, desc, eq, gte, lt, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { activity, attendance, enrollment, staff, type ActivityTable } from "@/db/schema"
import { member, user } from "@/db/schema/auth.schema"
import { BadRequestError, NotFoundError } from "@/common/errors"
import type { Activity, PaginationServiceResponse } from "@/common/types"
import type { CreateActivitySchema, FindActivitiesSchema, UpdateActivitySchema } from "@/api/routes/activity-router"
import { updateActivityDetailsSchemas, updateNapDetailsSchema } from "@/api/routes/activity-router/activity.request"

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export type CreateActivity = DistributiveOmit<CreateActivitySchema, "childId"> & {
  attendanceId: string
  staffId: string
}

export type UpdateActivity = UpdateActivitySchema

export type FindActivities = FindActivitiesSchema & {
  childrenCentreId: string
}


export class ActivityService {
  constructor(private db: Db, private activity: ActivityTable) {
  }

  private get columns() {
    return {
      id: this.activity.id,
      attendanceId: this.activity.attendanceId,
      type: this.activity.type,
      description: this.activity.description,
      details: this.activity.details,
      staff: {
        id: staff.id,
        name: user.name,
      },
      createdAt: this.activity.createdAt,
      updatedAt: this.activity.updatedAt,
    }
  }

  private select() {
    return this.db.select(this.columns)
      .from(this.activity)
      .innerJoin(attendance, eq(attendance.id, this.activity.attendanceId))
      .innerJoin(enrollment, eq(enrollment.id, attendance.enrollmentId))
      .innerJoin(staff, eq(staff.id, this.activity.staffId))
      .innerJoin(member, eq(member.id, staff.memberId))
      .innerJoin(user, eq(user.id, member.userId))
  }

  private filters({ childrenCentreId, attendanceId, childId, type, date }: Pick<FindActivities, "childrenCentreId" | "attendanceId" | "childId" | "type" | "date">) {
    const filters: SQL[] = [eq(enrollment.childrenCentreId, childrenCentreId)]
    if (attendanceId) filters.push(eq(this.activity.attendanceId, attendanceId))
    if (childId) filters.push(eq(enrollment.childId, childId))
    if (type) filters.push(eq(this.activity.type, type))
    if (date) {
      const start = new Date(`${date}T00:00:00`)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      filters.push(gte(this.activity.createdAt, start), lt(this.activity.createdAt, end))
    }

    return and(...filters)
  }

  private mergeDetails(current: Activity, details: NonNullable<UpdateActivity["details"]>): Record<string, unknown> {
    if (current.type === "nap") {
      const parsed = updateNapDetailsSchema.safeParse(details)

      if (!parsed.success) throw new BadRequestError(`Details are not valid for a nap activity`)

      const { hasEnded, ...rest } = parsed.data
      const merged: Record<string, unknown> = { ...current.details, ...rest }
      if (hasEnded === true) merged.endTime = current.details.endTime ?? new Date().toISOString()
      if (hasEnded === false) merged.endTime = null

      return merged
    }

    const parsed = updateActivityDetailsSchemas[current.type].safeParse(details)

    if (!parsed.success) throw new BadRequestError(`Details are not valid for a ${current.type} activity`)

    return { ...current.details, ...parsed.data }
  }

  async create({ attendanceId, staffId, description, ...activity }: CreateActivity, childrenCentreId: string): Promise<Activity> {
    const details = activity.type === "nap"
      ? { startTime: activity.details.startTime ?? new Date().toISOString(), endTime: null }
      : activity.details

    const [res] = await this.db.insert(this.activity).values({
      attendanceId,
      staffId,
      type: activity.type,
      description,
      details,
    }).returning({ id: this.activity.id })

    return this.findOne(res!.id, childrenCentreId)
  }

  async find({ page, perPage, paginate, ...filterValues }: FindActivities): Promise<PaginationServiceResponse<Activity>> {
    const where = this.filters(filterValues)

    const query = this.select()
      .where(where)
      .orderBy(desc(this.activity.createdAt), desc(this.activity.id))

    if (!paginate) {
      const data = await query

      return {
        data,
        meta: { page: 1, perPage: data.length, totalPages: 1, totalCount: data.length },
      }
    }

    const [data, [total]] = await Promise.all([
      query.limit(perPage).offset(perPage * (page - 1)),
      this.db.select({ totalCount: count() })
        .from(this.activity)
        .innerJoin(attendance, eq(attendance.id, this.activity.attendanceId))
        .innerJoin(enrollment, eq(enrollment.id, attendance.enrollmentId))
        .where(where),
    ])

    const totalCount = total?.totalCount ?? 0

    return {
      data,
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string, childrenCentreId: string): Promise<Activity> {
    const [res] = await this.select()
      .where(and(eq(this.activity.id, id), eq(enrollment.childrenCentreId, childrenCentreId)))
      .limit(1)

    if (!res) throw new NotFoundError(`Activity ${id} not found`)

    return res
  }

  async update(id: string, childrenCentreId: string, { description, details }: UpdateActivity): Promise<Activity> {
    const current = await this.findOne(id, childrenCentreId)

    await this.db.update(this.activity)
      .set({
        description,
        details: details === undefined ? undefined : this.mergeDetails(current, details),
      })
      .where(eq(this.activity.id, id))

    return this.findOne(id, childrenCentreId)
  }

  async existsByStaffId(staffId: string): Promise<boolean> {
    const [res] = await this.db.select({ id: this.activity.id })
      .from(this.activity)
      .where(eq(this.activity.staffId, staffId))
      .limit(1)

    return !!res
  }
}


export const activityService = new ActivityService(db, activity);
