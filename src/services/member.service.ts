import { and, asc, count, eq, ilike, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { member, user } from "@/db/schema/auth.schema"
import { NotFoundError } from "@/common/errors"
import type { Member, PaginationServiceResponse } from "@/common/types"
import type { PaginationQuery } from "@/api/schemas"

export type MemberTable = typeof member

export type FindMembers = PaginationQuery & {
  organizationId: string
  name?: string | undefined
  role?: string | undefined
}


export class MemberService {
  constructor(private db: Db, private member: MemberTable) {
  }

  private get columns() {
    return {
      id: this.member.id,
      name: user.name,
      email: user.email,
      userId: this.member.userId,
      organizationId: this.member.organizationId,
      role: this.member.role,
    }
  }

  private select() {
    return this.db.select(this.columns)
      .from(this.member)
      .innerJoin(user, eq(user.id, this.member.userId))
  }

  async find({ page, perPage, paginate, organizationId, name, role }: FindMembers): Promise<PaginationServiceResponse<Member>> {
    const filters: SQL[] = [eq(this.member.organizationId, organizationId)]
    if (name) filters.push(ilike(user.name, `%${name}%`))
    if (role) filters.push(eq(this.member.role, role))

    const where = and(...filters)

    const query = this.select()
      .where(where)
      .orderBy(asc(user.name), asc(this.member.id))

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
        .from(this.member)
        .innerJoin(user, eq(user.id, this.member.userId))
        .where(where),
    ])

    const totalCount = total?.totalCount ?? 0

    return {
      data,
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string, organizationId: string): Promise<Member> {
    const [res] = await this.select()
      .where(and(eq(this.member.id, id), eq(this.member.organizationId, organizationId)))
      .limit(1)

    if (!res) throw new NotFoundError(`Member ${id} not found`)

    return res
  }

  async findByUserId(userId: string, organizationId: string): Promise<Member> {
    const [res] = await this.select()
      .where(and(eq(this.member.userId, userId), eq(this.member.organizationId, organizationId)))
      .limit(1)

    if (!res) throw new NotFoundError(`Member with userId ${userId} not found`)

    return res
  }
}


export const memberService = new MemberService(db, member);
