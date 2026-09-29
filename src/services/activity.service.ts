import { and, count, desc, eq, gte, lt, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { activity, attendance, enrollment, staff, type ActivityTable } from "@/db/schema"
import { member, user } from "@/db/schema/auth.schema"
import { NotFoundError } from "@/common/errors"
import type { Activity, PaginationServiceResponse } from "@/common/types"
import type { PaginationQuery } from "@/api/schemas"

export interface CreateActivity {
  attendanceId: string
  staffId: string
  type: Activity["type"]
  description: string
  details: Record<string, unknown>
}

export type UpdateActivity = {
  type?: Activity["type"] | undefined
  description?: string | undefined
  details?: Record<string, unknown> | undefined
}

export type FindActivities = PaginationQuery & {
  childrenCentreId: string
  attendanceId?: string | undefined
  childId?: string | undefined
  type?: Activity["type"] | undefined
  date?: string | undefined
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

  async create({ attendanceId, staffId, type, description, details }: CreateActivity, childrenCentreId: string): Promise<Activity> {
    const [res] = await this.db.insert(this.activity).values({
      attendanceId,
      staffId,
      type,
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

  async update(id: string, childrenCentreId: string, { type, description, details }: UpdateActivity): Promise<Activity> {
    await this.findOne(id, childrenCentreId)

    await this.db.update(this.activity)
      .set({
        type,
        description,
        details,
      })
      .where(eq(this.activity.id, id))

    return this.findOne(id, childrenCentreId)
  }

}


export const activityService = new ActivityService(db, activity);
