import { and, asc, count, eq, ilike, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { parent, type ParentTable } from "@/db/schema"
import { member, user } from "@/db/schema/auth.schema"
import { NotFoundError } from "@/common/errors"
import type { PaginationServiceResponse, Parent } from "@/common/types"
import type { FindParentsSchema } from "@/api/routes/parent-router"

export interface CreateParent {
  phoneNumber :string
  memberId: string
}

export type UpdateParent = {
  phoneNumber?: string | undefined
  address?: string | undefined
  emergencyContact?: string | undefined
}


export class ParentService {
  constructor(private db: Db, private parent: ParentTable) {
  }

  private get columns() {
    return {
      id: this.parent.id,
      name: user.name,
      email: user.email,
      memberId: this.parent.memberId,
      phoneNumber: this.parent.phoneNumber,
      address: this.parent.address,
      emergencyContact: this.parent.emergencyContact,
    }
  }

  private select() {
    return this.db.select(this.columns)
      .from(this.parent)
      .innerJoin(member, eq(member.id, this.parent.memberId))
      .innerJoin(user, eq(user.id, member.userId))
  }

  async create({ memberId, phoneNumber }: CreateParent): Promise<Parent> {
    const [res] = await this.db.insert(this.parent).values({
      memberId,
      phoneNumber
    }).returning({ id: this.parent.id })

    return this.findOne(res!.id)
  }

  async find({ page, perPage, paginate, name }: FindParentsSchema): Promise<PaginationServiceResponse<Parent>> {
    const filters: SQL[] = []
    if (name) filters.push(ilike(user.name, `%${name}%`))

    const where = and(...filters)

    const query = this.select()
      .where(where)
      .orderBy(asc(user.name), asc(this.parent.id))

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
        .from(this.parent)
        .innerJoin(member, eq(member.id, this.parent.memberId))
        .innerJoin(user, eq(user.id, member.userId))
        .where(where),
    ])

    const totalCount = total?.totalCount ?? 0

    return {
      data,
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string): Promise<Parent> {
    const [res] = await this.select()
      .where(eq(this.parent.id, id))
      .limit(1)

    if (!res) throw new NotFoundError(`Parent ${id} not found`)

    return res
  }

  async findByMemberId(memberId: string): Promise<Parent> {
    const [res] = await this.select()
      .where(eq(this.parent.memberId, memberId))
      .limit(1)

    if (!res) throw new NotFoundError(`Parent with memberId ${memberId} not found`)

    return res
  }

  async findUserId(id: string): Promise<string> {
    const [res] = await this.db.select({ userId: member.userId })
      .from(this.parent)
      .innerJoin(member, eq(member.id, this.parent.memberId))
      .where(eq(this.parent.id, id))
      .limit(1)

    if (!res) throw new NotFoundError(`Parent ${id} not found`)

    return res.userId
  }

  async update(id: string, { address, emergencyContact, phoneNumber }: UpdateParent): Promise<Parent> {
    if (address === undefined && emergencyContact === undefined && phoneNumber === undefined) return this.findOne(id)

    const [res] = await this.db.update(this.parent)
      .set({
        address,
        emergencyContact,
        phoneNumber
      })
      .where(eq(this.parent.id, id))
      .returning({ id: this.parent.id })

    if (!res) throw new NotFoundError(`Parent ${id} not found`)

    return this.findOne(res.id)
  }

}


export const parentService = new ParentService(db, parent);
