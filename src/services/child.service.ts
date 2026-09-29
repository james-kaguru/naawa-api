import { and, asc, eq, ilike, inArray, type SQL } from "drizzle-orm"
import { db, type Db } from "@/db"
import { child, childParent, type ChildParentTable, type ChildTable } from "@/db/schema"
import NotFoundError from "@/common/errors/not-found.error"
import type { PaginationServiceResponse } from "@/common/types"
import type { FindChildrenSchema } from "@/api/routes/child-router"

export type Child = ChildTable["$inferSelect"]

export interface CreateChild {
  parentId: string
  name: string
  dateOfBirth: string
}

export type UpdateChild = {
  name?: string | undefined
  dateOfBirth?: string | undefined
  allergies?: string | undefined
  specialInstructions?: string | undefined
  medicalNotes?: string | undefined
}


export class ChildService {
  constructor(private db: Db, private child: ChildTable, private childParent: ChildParentTable) {
  }

  async create({ parentId, name, dateOfBirth }: CreateChild) {
    return this.db.transaction(async (tx) => {
      const [res] = await tx.insert(this.child).values({
        name,
        dateOfBirth,
      }).returning()

      await tx.insert(this.childParent).values({
        childId: res!.id,
        parentId
      })

      return res!
    })
  }

  async find({ page, perPage, paginate, name, parentId }: FindChildrenSchema): Promise<PaginationServiceResponse<Child>> {
    const filters: SQL[] = []
    if (name) filters.push(ilike(this.child.name, `%${name}%`))
    if (parentId) {
      filters.push(inArray(
        this.child.id,
        this.db.select({ id: this.childParent.childId })
          .from(this.childParent)
          .where(eq(this.childParent.parentId, parentId))
      ))
    }

    const where = and(...filters)

    const query = this.db.select()
      .from(this.child)
      .where(where)
      .orderBy(asc(this.child.name), asc(this.child.id))

    if (!paginate) {
      const data = await query

      return {
        data,
        meta: { page: 1, perPage: data.length, totalPages: 1, totalCount: data.length },
      }
    }

    const [data, totalCount] = await Promise.all([
      query.limit(perPage).offset(perPage * (page - 1)),
      this.db.$count(this.child, where),
    ])

    return {
      data,
      meta: { page, perPage, totalPages: Math.ceil(totalCount / perPage), totalCount },
    }
  }

  async findOne(id: string) {
    const res = await this.db.query.child.findFirst({
      where: { id },
      with: { parents: true }
    })

    if (!res) throw new NotFoundError(`Child ${id} not found`)

    return res
  }

  async update(id: string, { name, dateOfBirth, allergies, specialInstructions, medicalNotes }: UpdateChild) {
    const [res] = await this.db.update(this.child)
      .set({
        name,
        dateOfBirth,
        allergies,
        specialInstructions,
        medicalNotes
      })
      .where(eq(this.child.id, id))
      .returning()

    if (!res) throw new NotFoundError(`Child ${id} not found`)

    return res
  }

  async addParent(childId: string, parentId: string) {
    const [res] = await this.db.insert(this.childParent)
      .values({ childId, parentId })
      .onConflictDoNothing()
      .returning()

    return res
  }

}


export const childService = new ChildService(db, child, childParent);
