import { and, asc, eq, ilike, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { childrenCentre, type ChildrenCentreTable } from "@/db/schema"
import NotFoundError from "@/common/errors/not-found.error"
import BadRequestError from "@/common/errors/bad-request.error"
import type { ChildrenCentre, PaginationServiceResponse } from "@/common/types"
import type { PaginationQuery } from "@/api/schemas"
import { ORGANIZATION_ID } from "@/common/constants"



export interface CreateChildrenCentre {
  name: string
  location: string
}

export type UpdateChildrenCentre = {
  name?: string | undefined
  location?: string | undefined
}

export type FindChildrenCentres = PaginationQuery & {
  name?: string | undefined
  location?: string | undefined
}


export class ChildrenCentreService {
  constructor(private db: Db, private childrenCentre: ChildrenCentreTable) {
  }

  async create({ name, location }: CreateChildrenCentre) {
    const existing = await this.db.query.childrenCentre.findFirst({
      where: { organizationId:  ORGANIZATION_ID }
    })

    if (existing) throw new BadRequestError(`Organization ${ORGANIZATION_ID} already has a children centre`)

    const [res] = await this.db.insert(this.childrenCentre).values({
      name,
      location,
      organizationId:ORGANIZATION_ID
    }).returning()

    return res
  }

  async find({ page, perPage, paginate, name, location }: FindChildrenCentres): Promise<PaginationServiceResponse<ChildrenCentre>> {
    const filters: SQL[] = []
    if (name) filters.push(ilike(this.childrenCentre.name, `%${name}%`))
    if (location) filters.push(ilike(this.childrenCentre.location, `%${location}%`))

    const where = and(...filters)

    const query = this.db.select()
      .from(this.childrenCentre)
      .where(where)
      .orderBy(asc(this.childrenCentre.name), asc(this.childrenCentre.id))

    if (!paginate) {
      const data = await query

      return {
        data,
        meta: { page: 1, perPage: data.length, totalPages: 1, totalCount: data.length },
      }
    }

    const [data, totalCount] = await Promise.all([
      query.limit(perPage).offset(perPage * (page - 1)),
      this.db.$count(this.childrenCentre, where),
    ])

    return {
      data,
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string) {
    const res = await this.db.query.childrenCentre.findFirst({
      where: { id }
    })

    if (!res) throw new NotFoundError(`Children centre ${id} not found`)

    return res
  }

  async findByOrganizationId(organizationId: string) {
    const res = await this.db.query.childrenCentre.findFirst({
      where: { organizationId }
    })

    if (!res) throw new NotFoundError(`Children centre for organization ${organizationId} not found`)

    return res
  }

  async update(id: string, { name, location }: UpdateChildrenCentre) {
    const [res] = await this.db.update(this.childrenCentre)
      .set({
        name,
        location
      })
      .where(eq(this.childrenCentre.id, id))
      .returning()

    if (!res) throw new NotFoundError(`Children centre ${id} not found`)

    return res
  }

}


export const childrenCentreService = new ChildrenCentreService(db, childrenCentre);
