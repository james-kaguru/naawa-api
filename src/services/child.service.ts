import {
  and,
  eq,
  ilike,
  inArray,
  notInArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { db, type Db } from "@/db";
import {
  child,
  childParent,
  type ChildParentTable,
  type ChildTable,
} from "@/db/schema";
import { NotFoundError } from "@/common/errors";
import type { Child, PaginationServiceResponse } from "@/common/types";
import type { FindChildrenSchema } from "@/api/routes/child-router";
import type { FindUnenrolledChildrenSchema } from "@/api/routes/enrollment-router";
import type { FindNotCheckedInChildrenSchema } from "@/api/routes/attendance-router";
import { childColumns, childWith } from "./columns";

export interface CreateChild {
  parentId: string;
  name: string;
  dateOfBirth: string;
}

export type UpdateChild = {
  name?: string | undefined;
  dateOfBirth?: string | undefined;
  allergies?: string | undefined;
  specialInstructions?: string | undefined;
  medicalNotes?: string | undefined;
};

export type FindUnenrolledChildren = FindUnenrolledChildrenSchema & {
  enrolledChildIds: string[];
};

export type FindNotCheckedInChildren = Omit<
  FindNotCheckedInChildrenSchema,
  "date"
> & {
  enrolledChildIds: string[];
  checkedInChildIds: string[];
};

export class ChildService {
  constructor(
    private db: Db,
    private child: ChildTable,
    private childParent: ChildParentTable,
  ) {}

  private readonly columns = childColumns;

  private readonly with = childWith;

  private filters(
    table: ChildTable,
    { name, parentId }: Pick<FindChildrenSchema, "name" | "parentId">,
  ) {
    const filters: SQL[] = [];
    if (name) filters.push(ilike(table.name, `%${name}%`));
    if (parentId) {
      filters.push(
        inArray(
          table.id,
          this.db
            .select({ id: this.childParent.childId })
            .from(this.childParent)
            .where(eq(this.childParent.parentId, parentId)),
        ),
      );
    }

    return and(...filters);
  }

  private unenrolledFilters(
    table: ChildTable,
    { name, enrolledChildIds }: Pick<FindUnenrolledChildren, "name" | "enrolledChildIds">,
  ) {
    const filters: SQL[] = [notInArray(table.id, enrolledChildIds)];
    if (name) filters.push(ilike(table.name, `%${name}%`));

    return and(...filters);
  }

  private notCheckedInFilters(
    table: ChildTable,
    {
      name,
      enrolledChildIds,
      checkedInChildIds,
    }: Pick<FindNotCheckedInChildren, "name" | "enrolledChildIds" | "checkedInChildIds">,
  ) {
    const filters: SQL[] = [
      inArray(table.id, enrolledChildIds),
      notInArray(table.id, checkedInChildIds),
    ];
    if (name) filters.push(ilike(table.name, `%${name}%`));

    return and(...filters);
  }

  async create({ parentId, name, dateOfBirth }: CreateChild): Promise<Child> {
    const id = await this.db.transaction(async (tx) => {
      const [res] = await tx
        .insert(this.child)
        .values({
          name,
          dateOfBirth,
        })
        .returning({ id: this.child.id });

      await tx.insert(this.childParent).values({
        childId: res!.id,
        parentId,
      });

      return res!.id;
    });

    return this.findOne(id);
  }

  async find({
    page,
    perPage,
    paginate,
    name,
    parentId,
  }: FindChildrenSchema): Promise<PaginationServiceResponse<Child>> {
    const query = {
      columns: this.columns,
      with: this.with,
      where: {
        RAW: (table: ChildTable) =>
          this.filters(table, { name, parentId }) ?? sql`true`,
      },
      orderBy: { name: "asc", id: "asc" },
    } as const;

    if (!paginate) {
      const data = await this.db.query.child.findMany(query);

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

    const [data, totalCount] = await Promise.all([
      this.db.query.child.findMany({
        ...query,
        limit: perPage,
        offset: perPage * (page - 1),
      }),
      this.db.$count(this.child, this.filters(this.child, { name, parentId })),
    ]);

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

  async findUnenrolled({
    page,
    perPage,
    paginate,
    name,
    enrolledChildIds,
  }: FindUnenrolledChildren): Promise<PaginationServiceResponse<Child>> {
    const query = {
      columns: this.columns,
      with: this.with,
      where: {
        RAW: (table: ChildTable) =>
          this.unenrolledFilters(table, { name, enrolledChildIds }) ?? sql`true`,
      },
      orderBy: { name: "asc", id: "asc" },
    } as const;

    if (!paginate) {
      const data = await this.db.query.child.findMany(query);

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

    const [data, totalCount] = await Promise.all([
      this.db.query.child.findMany({
        ...query,
        limit: perPage,
        offset: perPage * (page - 1),
      }),
      this.db.$count(
        this.child,
        this.unenrolledFilters(this.child, { name, enrolledChildIds }),
      ),
    ]);

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

  async findNotCheckedIn({
    page,
    perPage,
    paginate,
    name,
    enrolledChildIds,
    checkedInChildIds,
  }: FindNotCheckedInChildren): Promise<PaginationServiceResponse<Child>> {
    const filters = { name, enrolledChildIds, checkedInChildIds };

    const query = {
      columns: this.columns,
      with: this.with,
      where: {
        RAW: (table: ChildTable) =>
          this.notCheckedInFilters(table, filters) ?? sql`true`,
      },
      orderBy: { name: "asc", id: "asc" },
    } as const;

    if (!paginate) {
      const data = await this.db.query.child.findMany(query);

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

    const [data, totalCount] = await Promise.all([
      this.db.query.child.findMany({
        ...query,
        limit: perPage,
        offset: perPage * (page - 1),
      }),
      this.db.$count(this.child, this.notCheckedInFilters(this.child, filters)),
    ]);

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

  async findOne(id: string): Promise<Child> {
    const res = await this.db.query.child.findFirst({
      where: { id },
      columns: this.columns,
      with: this.with,
    });

    if (!res) throw new NotFoundError(`Child ${id} not found`);

    return res;
  }

  async findByParentId(id: string, parentId: string): Promise<Child> {
    const res = await this.db.query.child.findFirst({
      columns: this.columns,
      with: this.with,
      where: {
        RAW: (table: ChildTable) =>
          this.filters(table, { parentId }) ?? sql`true`,
      },
    });

    if (!res) throw new NotFoundError(`Child ${id} not found`);

    return res;
  }

  async update(
    id: string,
    {
      name,
      dateOfBirth,
      allergies,
      specialInstructions,
      medicalNotes,
    }: UpdateChild,
  ): Promise<Child> {
    const [res] = await this.db
      .update(this.child)
      .set({
        name,
        dateOfBirth,
        allergies,
        specialInstructions,
        medicalNotes,
      })
      .where(eq(this.child.id, id))
      .returning({ id: this.child.id });

    if (!res) throw new NotFoundError(`Child ${id} not found`);

    return this.findOne(res.id);
  }

  async addParent(childId: string, parentId: string): Promise<Child> {
    await this.db
      .insert(this.childParent)
      .values({ childId, parentId })
      .onConflictDoNothing();

    return this.findOne(childId);
  }
}

export const childService = new ChildService(db, child, childParent);
