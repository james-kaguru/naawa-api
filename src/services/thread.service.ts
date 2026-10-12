import { and, count, desc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, type Db } from "@/db";
import { thread, type ThreadTable } from "@/db/schema";
import { member, user } from "@/db/schema/auth.schema";
import { BadRequestError, NotFoundError } from "@/common/errors";
import type { PaginationServiceResponse, Thread } from "@/common/types";
import type { PaginationQuery } from "@/api/schemas";

const memberOne = alias(member, "member_one");
const memberTwo = alias(member, "member_two");
const userOne = alias(user, "user_one");
const userTwo = alias(user, "user_two");

export interface CreateThread {
  memberIdOne: string;
  memberIdTwo: string;
}

export type FindThreads = PaginationQuery & {
  memberId?: string | undefined;
};

export class ThreadService {
  constructor(
    private db: Db,
    private thread: ThreadTable,
  ) {}

  private get columns() {
    return {
      id: this.thread.id,
      memberOne: { id: memberOne.id, name: userOne.name },
      memberTwo: { id: memberTwo.id, name: userTwo.name },
      createdAt: this.thread.createdAt,
    };
  }

  private select() {
    return this.db
      .select(this.columns)
      .from(this.thread)
      .innerJoin(memberOne, eq(memberOne.id, this.thread.memberIdOne))
      .innerJoin(userOne, eq(userOne.id, memberOne.userId))
      .innerJoin(memberTwo, eq(memberTwo.id, this.thread.memberIdTwo))
      .innerJoin(userTwo, eq(userTwo.id, memberTwo.userId));
  }

  private hasMember(memberId: string) {
    return or(
      eq(this.thread.memberIdOne, memberId),
      eq(this.thread.memberIdTwo, memberId),
    );
  }

  private orderMembers({
    memberIdOne,
    memberIdTwo,
  }: CreateThread): CreateThread {
    return memberIdOne < memberIdTwo
      ? { memberIdOne, memberIdTwo }
      : { memberIdOne: memberIdTwo, memberIdTwo: memberIdOne };
  }

  async findOrCreate(members: CreateThread): Promise<Thread> {
    if (members.memberIdOne === members.memberIdTwo)
      throw new BadRequestError(`A thread needs two different members`);

    const { memberIdOne, memberIdTwo } = this.orderMembers(members);

    const [existing] = await this.db
      .select({ id: this.thread.id })
      .from(this.thread)
      .where(
        or(
          and(
            eq(this.thread.memberIdOne, memberIdOne),
            eq(this.thread.memberIdTwo, memberIdTwo),
          ),
          and(
            eq(this.thread.memberIdOne, memberIdTwo),
            eq(this.thread.memberIdTwo, memberIdOne),
          ),
        ),
      )
      .limit(1);

    if (existing) return this.findOne(existing.id, memberIdOne);

    const [res] = await this.db
      .insert(this.thread)
      .values({
        memberIdOne,
        memberIdTwo,
      })
      .returning({ id: this.thread.id });

    return this.findOne(res!.id, memberIdOne);
  }

  async find({
    page,
    perPage,
    paginate,
    memberId,
  }: FindThreads): Promise<PaginationServiceResponse<Thread>> {
    const where = memberId ? this.hasMember(memberId) : undefined;

    const query = this.select()
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

  async findOne(id: string, memberId?: string): Promise<Thread> {
    const [res] = await this.select()
      .where(
        and(
          eq(this.thread.id, id),
          memberId ? this.hasMember(memberId) : undefined,
        ),
      )
      .limit(1);

    if (!res) throw new NotFoundError(`Thread ${id} not found`);

    return res;
  }
}

export const threadService = new ThreadService(db, thread);
