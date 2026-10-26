import { and, eq, lte, ne, sql, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { enrollment, type EnrollmentTable } from "@/db/schema"
import { NotFoundError, BadRequestError } from "@/common/errors"
import type { ChildEnrollment, Enrollment, PaginationServiceResponse } from "@/common/types"
import type { FindEnrollmentsSchema } from "@/api/routes/enrollment-router"
import { childEnrollmentWith, enrollmentColumns, enrollmentWith } from "./columns"

export interface CreateEnrollment {
  childId: string
  childrenCentreId: string
  startDate: string
}

export type FindEnrollments = FindEnrollmentsSchema & {
  childrenCentreId: string
}

export type UpdateEnrollment = {
  status?: Enrollment["status"] | undefined
  startDate?: string | undefined
}


export class EnrollmentService {
  constructor(private db: Db, private enrollment: EnrollmentTable) {
  }

  private readonly columns = enrollmentColumns

  private readonly with = enrollmentWith

  private filters(table: EnrollmentTable, { childId, childrenCentreId, status }: Pick<FindEnrollments, "childId" | "childrenCentreId" | "status">) {
    const filters: SQL[] = []
    if (childId) filters.push(eq(table.childId, childId))
    if (childrenCentreId) filters.push(eq(table.childrenCentreId, childrenCentreId))
    if (status) filters.push(eq(table.status, status))

    return and(...filters)
  }

  async create({ childId, childrenCentreId, startDate }: CreateEnrollment): Promise<Enrollment> {
    const [existing] = await this.db.select({ id: this.enrollment.id })
      .from(this.enrollment)
      .where(and(
        eq(this.enrollment.childId, childId),
        eq(this.enrollment.childrenCentreId, childrenCentreId),
        eq(this.enrollment.status, "active"),
      ))
      .limit(1)

    if (existing) throw new BadRequestError(`Child ${childId} already has an active enrollment at children centre ${childrenCentreId}`)

    const [res] = await this.db.insert(this.enrollment).values({
      childId,
      childrenCentreId,
      startDate,
      status: "active",
    }).returning({ id: this.enrollment.id })

    return this.findOne(res!.id, childrenCentreId)
  }

  async find({ page, perPage, paginate, childId, childrenCentreId, status }: FindEnrollments): Promise<PaginationServiceResponse<Enrollment>> {
    const query = {
      columns: this.columns,
      with: this.with,
      where: { RAW: (table: EnrollmentTable) => this.filters(table, { childId, childrenCentreId, status }) ?? sql`true` },
      orderBy: { startDate: "asc", id: "asc" },
    } as const

    if (!paginate) {
      const data = await this.db.query.enrollment.findMany(query)

      return {
        data,
        meta: { page: 1, perPage: data.length, totalPages: 1, totalCount: data.length },
      }
    }

    const [data, totalCount] = await Promise.all([
      this.db.query.enrollment.findMany({ ...query, limit: perPage, offset: perPage * (page - 1) }),
      this.db.$count(this.enrollment, this.filters(this.enrollment, { childId, childrenCentreId, status })),
    ])

    return {
      data,
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string, childrenCentreId: string): Promise<Enrollment> {
    const res = await this.db.query.enrollment.findFirst({
      where: { id, childrenCentreId },
      columns: this.columns,
      with: this.with,
    })

    if (!res) throw new NotFoundError(`Enrollment ${id} not found`)

    return res
  }

  async findByChildId(childId: string): Promise<ChildEnrollment[]> {
    return this.db.query.enrollment.findMany({
      where: { childId },
      columns: this.columns,
      with: childEnrollmentWith,
      orderBy: { startDate: "desc", id: "asc" },
    })
  }

  async findActiveChildIds(childrenCentreId: string, startedOnOrBefore?: string): Promise<string[]> {
    const res = await this.db.select({ childId: this.enrollment.childId })
      .from(this.enrollment)
      .where(and(
        eq(this.enrollment.childrenCentreId, childrenCentreId),
        eq(this.enrollment.status, "active"),
        startedOnOrBefore ? lte(this.enrollment.startDate, startedOnOrBefore) : undefined,
      ))

    return res.map(({ childId }) => childId)
  }

  async findActiveByChildIds(childIds: string[], childrenCentreId: string): Promise<Enrollment[]> {
    const res = await this.db.query.enrollment.findMany({
      where: { childId: { in: childIds }, childrenCentreId, status: "active" },
      columns: this.columns,
      with: this.with,
    })

    const missing = childIds.filter((childId) => !res.some((enrollment) => enrollment.child.id === childId))

    if (missing.length) throw new BadRequestError(`Children ${missing.join(", ")} have no active enrollment at children centre ${childrenCentreId}`)

    return res
  }

  async update(id: string, childrenCentreId: string, { status, startDate }: UpdateEnrollment): Promise<Enrollment> {
    if (status === "active") {
      const [current] = await this.db.select({ childId: this.enrollment.childId })
        .from(this.enrollment)
        .where(and(eq(this.enrollment.id, id), eq(this.enrollment.childrenCentreId, childrenCentreId)))
        .limit(1)

      if (!current) throw new NotFoundError(`Enrollment ${id} not found`)

      const [existing] = await this.db.select({ id: this.enrollment.id })
        .from(this.enrollment)
        .where(and(
          ne(this.enrollment.id, id),
          eq(this.enrollment.childId, current.childId),
          eq(this.enrollment.childrenCentreId, childrenCentreId),
          eq(this.enrollment.status, "active"),
        ))
        .limit(1)

      if (existing) throw new BadRequestError(`Child ${current.childId} already has an active enrollment at children centre ${childrenCentreId}`)
    }

    const [res] = await this.db.update(this.enrollment)
      .set({
        status,
        startDate
      })
      .where(and(eq(this.enrollment.id, id), eq(this.enrollment.childrenCentreId, childrenCentreId)))
      .returning({ id: this.enrollment.id })

    if (!res) throw new NotFoundError(`Enrollment ${id} not found`)

    return this.findOne(res.id, childrenCentreId)
  }

}


export const enrollmentService = new EnrollmentService(db, enrollment);
