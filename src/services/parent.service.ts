import { and, asc, eq, ilike, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { parent, type ParentTable } from "@/db/schema"
import NotFoundError from "@/common/errors/not-found.error"
import type { PaginationServiceResponse } from "@/common/types"
import type { FindParentsSchema } from "@/api/routes/parent-router"

export type Parent = ParentTable["$inferSelect"]

export interface CreateParent {
  name: string
  phoneNumber :string
  memberId: string
}

export type UpdateParent = {
  name?: string | undefined
  phoneNumber?: string | undefined
  address?: string | undefined
  emergencyContact?: string | undefined
}


export class ParentService {
  constructor(private db: Db, private parent: ParentTable) {
  }

  async create({ name, memberId,phoneNumber }: CreateParent) {
    const [res] = await this.db.insert(this.parent).values({
      name,
      memberId,
      phoneNumber
    }).returning()

    return res
  }

  async find({ page, perPage, paginate, name }: FindParentsSchema): Promise<PaginationServiceResponse<Parent>> {
    const filters: SQL[] = []
    if (name) filters.push(ilike(this.parent.name, `%${name}%`))

    const where = and(...filters)

    const query = this.db.select()
      .from(this.parent)
      .where(where)
      .orderBy(asc(this.parent.name), asc(this.parent.id))

    if (!paginate) {
      const data = await query

      return {
        data,
        meta: { page: 1, perPage: data.length, totalPages: 1, totalCount: data.length },
      }
    }

    const [data, totalCount] = await Promise.all([
      query.limit(perPage).offset(perPage * (page - 1)),
      this.db.$count(this.parent, where),
    ])

    return {
      data,
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string) {
    const res = await this.db.query.parent.findFirst({
      where: { id }
    })

    if (!res) throw new NotFoundError(`Parent ${id} not found`)

    return res
  }

  async findByMemberId(memberId: string) {
    const res = await this.db.query.parent.findFirst({
      where: { memberId }
    })

    if (!res) throw new NotFoundError(`Parent with memberId ${memberId} not found`)

    return res

  }

  async update(id: string, { name,address,emergencyContact,phoneNumber }: UpdateParent) {
    const [res] = await this.db.update(this.parent)
      .set({
        name,
        address,
        emergencyContact,
        phoneNumber
      })
      .where(eq(this.parent.id, id))
      .returning()

    if (!res) throw new NotFoundError(`Parent ${id} not found`)

    return res
  }

}


export const parentService = new ParentService(db, parent);
