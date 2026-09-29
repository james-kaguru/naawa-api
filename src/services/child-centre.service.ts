import { and, asc, eq, ilike, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { childrenCentre, type ChildrenCentreTable } from "@/db/schema"
import NotFoundError from "@/common/errors/not-found.error"
import BadRequestError from "@/common/errors/bad-request.error"
import type { ChildrenCentre, PaginationServiceResponse } from "@/common/types"
import type { FindChildrenCentresSchema } from "@/api/routes/children-centre-router"
import { ORGANIZATION_ID } from "@/common/constants"

export interface CreateChildrenCentre {
  name: string
  location: string
}

export type UpdateChildrenCentre = {
  name?: string | undefined
  location?: string | undefined
}


export class ChildrenCentreService {
  constructor(private db: Db, private childrenCentre: ChildrenCentreTable) {
  }

  private get columns() {
    return {
      id: this.childrenCentre.id,
      name: this.childrenCentre.name,
      location: this.childrenCentre.location,
    }
  }

  async create({ name, location }: CreateChildrenCentre): Promise<ChildrenCentre> {
    const existing = await this.db.query.childrenCentre.findFirst({
      where: { organizationId:  ORGANIZATION_ID },
      columns: { id: true }
    })

    if (existing) throw new BadRequestError(`Organization ${ORGANIZATION_ID} already has a children centre`)

    const [res] = await this.db.insert(this.childrenCentre).values({
      name,
      location,
      organizationId:ORGANIZATION_ID
    }).returning(this.columns)

    return res!
  }

  async find({ page, perPage, paginate, name, location }: FindChildrenCentresSchema): Promise<PaginationServiceResponse<ChildrenCentre>> {
    const filters: SQL[] = []
    if (name) filters.push(ilike(this.childrenCentre.name, `%${name}%`))
    if (location) filters.push(ilike(this.childrenCentre.location, `%${location}%`))

    const where = and(...filters)

    const query = this.db.select(this.columns)
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

  async findOne(id: string): Promise<ChildrenCentre> {
    const res = await this.db.query.childrenCentre.findFirst({
      where: { id },
      columns: { organizationId: false }
    })

    if (!res) throw new NotFoundError(`Children centre ${id} not found`)

    return res
  }

  async findByOrganizationId(organizationId: string): Promise<ChildrenCentre> {
    const res = await this.db.query.childrenCentre.findFirst({
      where: { organizationId },
      columns: { organizationId: false }
    })

    if (!res) throw new NotFoundError(`Children centre for organization ${organizationId} not found`)

    return res
  }

  async update(id: string, { name, location }: UpdateChildrenCentre): Promise<ChildrenCentre> {
    const [res] = await this.db.update(this.childrenCentre)
      .set({
        name,
        location
      })
      .where(eq(this.childrenCentre.id, id))
      .returning(this.columns)

    if (!res) throw new NotFoundError(`Children centre ${id} not found`)

    return res
  }

}


export const childrenCentreService = new ChildrenCentreService(db, childrenCentre);
