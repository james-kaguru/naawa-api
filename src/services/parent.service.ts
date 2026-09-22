import { eq } from "drizzle-orm"
import { db, type Db } from "@/db"
import { parent, type ParentTable } from "@/db/schema"
import NotFoundError from "@/common/errors/not-found.error"

export interface CreateParent {
  name: string
  memberId: string
}

export type UpdateParent = Partial<CreateParent>

export class ParentService {
  constructor(private db: Db, private parent: ParentTable) {
  }

  async create({ name, memberId }: CreateParent) {
    const [created] = await this.db.insert(this.parent).values({
      name,
      memberId
    }).returning()

    return created
  }

  async find() {
    return this.db.query.parent.findMany()
  }

  async findOne(id: string) {
    const found = await this.db.query.parent.findFirst({
      where: { id }
    })

    if (!found) throw new NotFoundError(`Parent ${id} not found`)

    return found
  }

  async update(id: string, { name, memberId }: UpdateParent) {
    const [updated] = await this.db.update(this.parent)
      .set({ name, memberId })
      .where(eq(this.parent.id, id))
      .returning()

    if (!updated) throw new NotFoundError(`Parent ${id} not found`)

    return updated
  }

  async delete(id: string) {
    const [deleted] = await this.db.delete(this.parent)
      .where(eq(this.parent.id, id))
      .returning()

    if (!deleted) throw new NotFoundError(`Parent ${id} not found`)

    return deleted
  }
}


export default new ParentService(db, parent);
