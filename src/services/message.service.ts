import { and, count, desc, eq, isNull, ne } from "drizzle-orm";
import { db, type Db } from "@/db";
import { message, type MessageTable } from "@/db/schema";
import { member, user } from "@/db/schema/auth.schema";
import { NotFoundError } from "@/common/errors";
import type { Message, PaginationServiceResponse } from "@/common/types";
import type { PaginationQuery } from "@/api/schemas";

export interface CreateMessage {
  threadId: string;
  senderId: string;
  body: string;
}

export type FindMessages = PaginationQuery & {
  threadId: string;
};

export class MessageService {
  constructor(
    private db: Db,
    private message: MessageTable,
  ) {}

  private get columns() {
    return {
      id: this.message.id,
      threadId: this.message.threadId,
      sender: { id: member.id, name: user.name },
      body: this.message.body,
      readAt: this.message.readAt,
      createdAt: this.message.createdAt,
    };
  }

  private select() {
    return this.db
      .select(this.columns)
      .from(this.message)
      .innerJoin(member, eq(member.id, this.message.senderId))
      .innerJoin(user, eq(user.id, member.userId));
  }

  async create({ threadId, senderId, body }: CreateMessage): Promise<Message> {
    const [res] = await this.db
      .insert(this.message)
      .values({
        threadId,
        senderId,
        body,
      })
      .returning({ id: this.message.id });

    return this.findOne(res!.id, threadId);
  }

  async find({
    page,
    perPage,
    paginate,
    threadId,
  }: FindMessages): Promise<PaginationServiceResponse<Message>> {
    const where = eq(this.message.threadId, threadId);

    const query = this.select()
      .where(where)
      .orderBy(desc(this.message.createdAt), desc(this.message.id));

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
      this.db.select({ totalCount: count() }).from(this.message).where(where),
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

  async findOne(id: string, threadId: string): Promise<Message> {
    const [res] = await this.select()
      .where(and(eq(this.message.id, id), eq(this.message.threadId, threadId)))
      .limit(1);

    if (!res) throw new NotFoundError(`Message ${id} not found`);

    return res;
  }

  async markAsRead(threadId: string, readerId: string): Promise<number> {
    const res = await this.db
      .update(this.message)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(this.message.threadId, threadId),
          ne(this.message.senderId, readerId),
          isNull(this.message.readAt),
        ),
      )
      .returning({ id: this.message.id });

    return res.length;
  }

  async countUnread(threadId: string, readerId: string): Promise<number> {
    return this.db.$count(
      this.message,
      and(
        eq(this.message.threadId, threadId),
        ne(this.message.senderId, readerId),
        isNull(this.message.readAt),
      ),
    );
  }
}

export const messageService = new MessageService(db, message);
