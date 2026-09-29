import { and, asc, count, eq, ilike, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { staff, type StaffTable } from "@/db/schema"
import { member, user } from "@/db/schema/auth.schema"
import NotFoundError from "@/common/errors/not-found.error"
import BadRequestError from "@/common/errors/bad-request.error"
import type { PaginationServiceResponse, Staff } from "@/common/types"
import type { PaginationQuery } from "@/api/schemas"

export interface CreateStaff {
  memberId: string
  childrenCentreId: string
}

export type UpdateStaff = {
  childrenCentreId?: string | undefined
}

export type FindStaff = PaginationQuery & {
  childrenCentreId?: string | undefined
  name?: string | undefined
}


export class StaffService {
  constructor(private db: Db, private staff: StaffTable) {
  }

  private get columns() {
    return {
      id: this.staff.id,
      name: user.name,
    }
  }

  private select() {
    return this.db.select(this.columns)
      .from(this.staff)
      .innerJoin(member, eq(member.id, this.staff.memberId))
      .innerJoin(user, eq(user.id, member.userId))
  }

  async create({ memberId, childrenCentreId }: CreateStaff): Promise<Staff> {
    const [existing] = await this.db.select({ id: this.staff.id })
      .from(this.staff)
      .where(eq(this.staff.memberId, memberId))
      .limit(1)

    if (existing) throw new BadRequestError(`Member ${memberId} is already a staff member`)

    const [res] = await this.db.insert(this.staff).values({
      memberId,
      childrenCentreId,
    }).returning({ id: this.staff.id })

    return this.findOne(res!.id)
  }

  async find({ page, perPage, paginate, childrenCentreId, name }: FindStaff): Promise<PaginationServiceResponse<Staff>> {
    const filters: SQL[] = []
    if (childrenCentreId) filters.push(eq(this.staff.childrenCentreId, childrenCentreId))
    if (name) filters.push(ilike(user.name, `%${name}%`))

    const where = and(...filters)

    const query = this.select()
      .where(where)
      .orderBy(asc(user.name), asc(this.staff.id))

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
        .from(this.staff)
        .innerJoin(member, eq(member.id, this.staff.memberId))
        .innerJoin(user, eq(user.id, member.userId))
        .where(where),
    ])

    const totalCount = total?.totalCount ?? 0

    return {
      data,
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string): Promise<Staff> {
    const [res] = await this.select()
      .where(eq(this.staff.id, id))
      .limit(1)

    if (!res) throw new NotFoundError(`Staff ${id} not found`)

    return res
  }

  async findByMemberId(memberId: string): Promise<Staff> {
    const [res] = await this.select()
      .where(eq(this.staff.memberId, memberId))
      .limit(1)

    if (!res) throw new NotFoundError(`Staff with memberId ${memberId} not found`)

    return res
  }

  async update(id: string, { childrenCentreId }: UpdateStaff): Promise<Staff> {
    const [res] = await this.db.update(this.staff)
      .set({
        childrenCentreId
      })
      .where(eq(this.staff.id, id))
      .returning({ id: this.staff.id })

    if (!res) throw new NotFoundError(`Staff ${id} not found`)

    return this.findOne(res.id)
  }

}


export const staffService = new StaffService(db, staff);
