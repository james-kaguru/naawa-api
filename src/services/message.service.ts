import { and, count, desc, eq, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, type Db } from "@/db";
import {
  message,
  parent,
  staff,
  thread,
  type MessageTable,
  type SenderType,
} from "@/db/schema";
import { member, user } from "@/db/schema/auth.schema";
import { NotFoundError } from "@/common/errors";
import type {
  Message,
  MessageParticipant,
  PaginationServiceResponse,
} from "@/common/types";
import type { PaginationQuery } from "@/api/schemas";

const parentMember = alias(member, "parent_member");
const parentUser = alias(user, "parent_user");
const staffMember = alias(member, "staff_member");
const staffUser = alias(user, "staff_user");

export interface CreateMessage {
  threadId: string;
  sender: SenderType;
  staffId: string | null;
  body: string;
}

export type FindMessages = PaginationQuery & {
  threadId: string;
};

type MessageRow = {
  id: string;
  senderType: SenderType;
  parent: MessageParticipant;
  staff: { id: string | null; name: string | null };
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

export class MessageService {
  constructor(
    private db: Db,
    private message: MessageTable,
  ) {}

  private get columns() {
    return {
      id: this.message.id,
      senderType: this.message.senderType,
      parent: { id: parent.id, name: parentUser.name },
      staff: { id: staff.id, name: staffUser.name },
      body: this.message.body,
      readAt: this.message.readAt,
      createdAt: this.message.createdAt,
    };
  }

  private select() {
    return this.db
      .select(this.columns)
      .from(this.message)
      .innerJoin(thread, eq(thread.id, this.message.threadId))
      .innerJoin(parent, eq(parent.id, thread.parentId))
      .innerJoin(parentMember, eq(parentMember.id, parent.memberId))
      .innerJoin(parentUser, eq(parentUser.id, parentMember.userId))
      .leftJoin(staff, eq(staff.id, this.message.staffId))
      .leftJoin(staffMember, eq(staffMember.id, staff.memberId))
      .leftJoin(staffUser, eq(staffUser.id, staffMember.userId));
  }

  private toMessage(row: MessageRow): Message {
    const staffParticipant: MessageParticipant | null = row.staff.id
      ? { id: row.staff.id, name: row.staff.name ?? "" }
      : null;

    const staffSent = row.senderType === "staff";

    return {
      id: row.id,
      sender: staffSent ? staffParticipant! : row.parent,
      recipient: staffSent ? row.parent : staffParticipant,
      body: row.body,
      isRead: row.readAt !== null,
      readAt: row.readAt,
      createdAt: row.createdAt,
    };
  }

  async create({
    threadId,
    sender,
    staffId,
    body,
  }: CreateMessage): Promise<Message> {
    const [res] = await this.db
      .insert(this.message)
      .values({
        threadId,
        senderType: sender,
        staffId,
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
        data: data.map((row) => this.toMessage(row)),
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
      data: data.map((row) => this.toMessage(row)),
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

    return this.toMessage(res);
  }

  async markAsRead(
    threadId: string,
    staffId: string | null,
    reader: SenderType,
  ): Promise<number> {
    const res = await this.db
      .update(this.message)
      .set(
        reader === "staff"
          ? { readAt: new Date(), staffId }
          : { readAt: new Date() },
      )
      .where(
        and(
          eq(this.message.threadId, threadId),
          ne(this.message.senderType, reader),
          isNull(this.message.readAt),
        ),
      )
      .returning({ id: this.message.id });

    return res.length;
  }

  async countUnread(threadId: string, reader: SenderType): Promise<number> {
    return this.db.$count(
      this.message,
      and(
        eq(this.message.threadId, threadId),
        ne(this.message.senderType, reader),
        isNull(this.message.readAt),
      ),
    );
  }
}

export const messageService = new MessageService(db, message);
