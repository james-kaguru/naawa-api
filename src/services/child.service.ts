import {
  and,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db, type Db } from "@/db";
import {
  attendance,
  child,
  childParent,
  enrollment,
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
  childrenCentreId: string;
};

export type FindNotCheckedInChildren = FindNotCheckedInChildrenSchema & {
  childrenCentreId: string;
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
    { name, childrenCentreId }: Pick<FindUnenrolledChildren, "name" | "childrenCentreId">,
  ) {
    const filters: SQL[] = [
      notInArray(
        table.id,
        this.db
          .select({ id: enrollment.childId })
          .from(enrollment)
          .where(
            and(
              eq(enrollment.childrenCentreId, childrenCentreId),
              eq(enrollment.status, "active"),
            ),
          ),
      ),
    ];
    if (name) filters.push(ilike(table.name, `%${name}%`));

    return and(...filters);
  }

  private notCheckedInFilters(
    table: ChildTable,
    {
      name,
      date,
      childrenCentreId,
    }: Pick<FindNotCheckedInChildren, "name" | "date" | "childrenCentreId">,
  ) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const filters: SQL[] = [
      inArray(
        table.id,
        this.db
          .select({ id: enrollment.childId })
          .from(enrollment)
          .where(
            and(
              eq(enrollment.childrenCentreId, childrenCentreId),
              eq(enrollment.status, "active"),
              notInArray(
                enrollment.id,
                this.db
                  .select({ id: attendance.enrollmentId })
                  .from(attendance)
                  .where(
                    or(
                      eq(attendance.status, "checkedIn"),
                      and(
                        gte(attendance.checkedInAt, start),
                        lt(attendance.checkedInAt, end),
                      ),
                    ),
                  ),
              ),
            ),
          ),
      ),
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
    childrenCentreId,
  }: FindUnenrolledChildren): Promise<PaginationServiceResponse<Child>> {
    const query = {
      columns: this.columns,
      with: this.with,
      where: {
        RAW: (table: ChildTable) =>
          this.unenrolledFilters(table, { name, childrenCentreId }) ?? sql`true`,
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
        this.unenrolledFilters(this.child, { name, childrenCentreId }),
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
    date,
    childrenCentreId,
  }: FindNotCheckedInChildren): Promise<PaginationServiceResponse<Child>> {
    const filters = { name, date, childrenCentreId };

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
