import { and, asc, eq, ilike, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { parent, type ParentTable } from "@/db/schema"
import NotFoundError from "@/common/errors/not-found.error"
import type { PaginationServiceResponse, Parent } from "@/common/types"
import type { FindParentsSchema } from "@/api/routes/parent-router"

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

  private get columns() {
    return {
      id: this.parent.id,
      name: this.parent.name,
      email: this.parent.email,
      memberId: this.parent.memberId,
      phoneNumber: this.parent.phoneNumber,
      address: this.parent.address,
      emergencyContact: this.parent.emergencyContact,
    }
  }

  async create({ name, memberId,phoneNumber }: CreateParent): Promise<Parent> {
    const [res] = await this.db.insert(this.parent).values({
      name,
      memberId,
      phoneNumber
    }).returning(this.columns)

    return res!
  }

  async find({ page, perPage, paginate, name }: FindParentsSchema): Promise<PaginationServiceResponse<Parent>> {
    const filters: SQL[] = []
    if (name) filters.push(ilike(this.parent.name, `%${name}%`))

    const where = and(...filters)

    const query = this.db.select(this.columns)
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

  async findOne(id: string): Promise<Parent> {
    const [res] = await this.db.select(this.columns)
      .from(this.parent)
      .where(eq(this.parent.id, id))
      .limit(1)

    if (!res) throw new NotFoundError(`Parent ${id} not found`)

    return res
  }

  async findByMemberId(memberId: string): Promise<Parent> {
    const [res] = await this.db.select(this.columns)
      .from(this.parent)
      .where(eq(this.parent.memberId, memberId))
      .limit(1)

    if (!res) throw new NotFoundError(`Parent with memberId ${memberId} not found`)

    return res

  }

  async update(id: string, { name,address,emergencyContact,phoneNumber }: UpdateParent): Promise<Parent> {
    const [res] = await this.db.update(this.parent)
      .set({
        name,
        address,
        emergencyContact,
        phoneNumber
      })
      .where(eq(this.parent.id, id))
      .returning(this.columns)

    if (!res) throw new NotFoundError(`Parent ${id} not found`)

    return res
  }

}


export const parentService = new ParentService(db, parent);
