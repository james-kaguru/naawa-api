import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { db, type Db } from "@/db";
import {
  childrenCentre,
  message,
  parent,
  thread,
  type SenderType,
  type ThreadTable,
} from "@/db/schema";
import { member, user } from "@/db/schema/auth.schema";
import { NotFoundError } from "@/common/errors";
import type { PaginationServiceResponse, Thread } from "@/common/types";
import type { PaginationQuery } from "@/api/schemas";

export interface CreateThread {
  childrenCentreId: string;
  parentId: string;
}

export type FindThreads = PaginationQuery & {
  parentId?: string | undefined;
  reader: SenderType;
};

export class ThreadService {
  constructor(
    private db: Db,
    private thread: ThreadTable,
  ) {}

  private columns(reader: SenderType) {
    return {
      id: this.thread.id,
      childrenCentre: { id: childrenCentre.id, name: childrenCentre.name },
      parent: { id: parent.id, name: user.name },
      unreadCount: sql<number>`(
        select count(*)::int
        from ${message}
        where ${message.threadId} = ${this.thread.id}
          and ${message.senderType} <> ${reader}
          and ${message.readAt} is null
      )`,
      createdAt: this.thread.createdAt,
    };
  }

  private select(reader: SenderType) {
    return this.db
      .select(this.columns(reader))
      .from(this.thread)
      .innerJoin(
        childrenCentre,
        eq(childrenCentre.id, this.thread.childrenCentreId),
      )
      .innerJoin(parent, eq(parent.id, this.thread.parentId))
      .innerJoin(member, eq(member.id, parent.memberId))
      .innerJoin(user, eq(user.id, member.userId));
  }

  async findOrCreate({
    childrenCentreId,
    parentId,
  }: CreateThread): Promise<Thread> {
    const [existing] = await this.db
      .select({ id: this.thread.id })
      .from(this.thread)
      .where(
        and(
          eq(this.thread.childrenCentreId, childrenCentreId),
          eq(this.thread.parentId, parentId),
        ),
      )
      .limit(1);

    if (existing) return this.findOne(existing.id, childrenCentreId);

    const [res] = await this.db
      .insert(this.thread)
      .values({
        childrenCentreId,
        parentId,
      })
      .returning({ id: this.thread.id });

    return this.findOne(res!.id, childrenCentreId);
  }

  async find(
    childrenCentreId: string,
    { page, perPage, paginate, parentId, reader }: FindThreads,
  ): Promise<PaginationServiceResponse<Thread>> {
    const filters: SQL[] = [eq(this.thread.childrenCentreId, childrenCentreId)];
    if (parentId) filters.push(eq(this.thread.parentId, parentId));

    const where = and(...filters);

    const query = this.select(reader)
      .where(where)
      .orderBy(desc(this.thread.createdAt), desc(this.thread.id));

    if (!paginate) {
      const data = await query;

      return {
        data,
        meta: {
          page: 1,
          perPage: data.length,
          totalPages: 1,
          totalCount: data.length,
        },
      };
    }

    const [data, [total]] = await Promise.all([
      query.limit(perPage).offset(perPage * (page - 1)),
      this.db.select({ totalCount: count() }).from(this.thread).where(where),
    ]);

    const totalCount = total?.totalCount ?? 0;

    return {
      data,
      meta: {
        page,
        perPage,
        totalPages: Math.ceil(totalCount / perPage),
        totalCount,
      },
    };
  }

  async findOne(
    id: string,
    childrenCentreId: string,
    parentId?: string,
    reader: SenderType = "parent",
  ): Promise<Thread> {
    const [res] = await this.select(reader)
      .where(
        and(
          eq(this.thread.id, id),
          eq(this.thread.childrenCentreId, childrenCentreId),
          parentId ? eq(this.thread.parentId, parentId) : undefined,
        ),
      )
      .limit(1);

    if (!res) throw new NotFoundError(`Thread ${id} not found`);

    return res;
  }
}

export const threadService = new ThreadService(db, thread);
