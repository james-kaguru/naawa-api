import { and, asc, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { db, type Db, type DbExecutor } from "@/db";
import {
  billingRun,
  billingRunItem,
  child,
  invoice,
  staff,
  type BillingRunItemOutcome,
  type BillingRunItemTable,
  type BillingRunTable,
} from "@/db/schema";
import { member, user } from "@/db/schema/auth.schema";
import { NotFoundError } from "@/common/errors";
import type {
  BillingRun,
  BillingRunItem,
  PaginationServiceResponse,
  PlainBillingRun,
} from "@/common/types";
import type { PaginationQuery } from "@/api/schemas";
import { staffSelect } from "./columns";

export type CreateBillingRunItem =
  | {
      childId: string;
      outcome: Exclude<BillingRunItemOutcome, "failed">;
      invoiceId: string;
      reason?: string | undefined;
    }
  | {
      childId: string;
      outcome: "failed";
      reason: string;
    };

export interface CreateBillingRun {
  childrenCentreId: string;
  createdByStaffId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  currency: string;
  description: string;
  amount: number;
  items: CreateBillingRunItem[];
}

export type FindBillingRuns = PaginationQuery & {
  periodStart?: string | undefined;
};

export class BillingRunService {
  constructor(
    private db: Db,
    private billingRun: BillingRunTable,
    private billingRunItem: BillingRunItemTable,
  ) {}

  private outcomeCount(outcome: BillingRunItemOutcome) {
    return sql<number>`(
      select count(*)::int
      from ${this.billingRunItem}
      where ${this.billingRunItem.billingRunId} = ${this.billingRun.id}
        and ${this.billingRunItem.outcome} = ${outcome}
    )`;
  }

  private get columns() {
    return {
      id: this.billingRun.id,
      periodStart: this.billingRun.periodStart,
      periodEnd: this.billingRun.periodEnd,
      dueDate: this.billingRun.dueDate,
      currency: this.billingRun.currency,
      description: this.billingRun.description,
      amount: this.billingRun.amount,
      createdBy: staffSelect(staff, user),
      summary: {
        created: this.outcomeCount("created"),
        skipped: this.outcomeCount("skipped"),
        failed: this.outcomeCount("failed"),
      },
      createdAt: this.billingRun.createdAt,
    };
  }

  private get itemColumns() {
    return {
      id: this.billingRunItem.id,
      child: { id: child.id, name: child.name },
      outcome: this.billingRunItem.outcome,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reason: this.billingRunItem.reason,
    };
  }

  private select() {
    return this.db
      .select(this.columns)
      .from(this.billingRun)
      .innerJoin(staff, eq(staff.id, this.billingRun.createdByStaffId))
      .innerJoin(member, eq(member.id, staff.memberId))
      .innerJoin(user, eq(user.id, member.userId));
  }

  private filters(childrenCentreId: string, { periodStart }: Pick<FindBillingRuns, "periodStart">) {
    const filters: SQL[] = [eq(this.billingRun.childrenCentreId, childrenCentreId)];
    if (periodStart) filters.push(eq(this.billingRun.periodStart, periodStart));

    return and(...filters);
  }

  async create(
    { items, ...run }: CreateBillingRun,
    executor: DbExecutor = this.db,
  ): Promise<string> {
    const [res] = await executor
      .insert(this.billingRun)
      .values(run)
      .returning({ id: this.billingRun.id });

    if (items.length) {
      await executor.insert(this.billingRunItem).values(
        items.map((item) => ({
          billingRunId: res!.id,
          childId: item.childId,
          outcome: item.outcome,
          invoiceId: item.outcome === "failed" ? null : item.invoiceId,
          reason: item.reason ?? "",
        })),
      );
    }

    return res!.id;
  }

  async find(
    childrenCentreId: string,
    { page, perPage, paginate, periodStart }: FindBillingRuns,
  ): Promise<PaginationServiceResponse<PlainBillingRun>> {
    const where = this.filters(childrenCentreId, { periodStart });

    const query = this.select()
      .where(where)
      .orderBy(desc(this.billingRun.createdAt), desc(this.billingRun.id));

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
      this.db.select({ totalCount: count() }).from(this.billingRun).where(where),
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

  async findOne(id: string, childrenCentreId: string): Promise<BillingRun> {
    const [res] = await this.select()
      .where(and(eq(this.billingRun.id, id), eq(this.billingRun.childrenCentreId, childrenCentreId)))
      .limit(1);

    if (!res) throw new NotFoundError(`Billing run ${id} not found`);

    return { ...res, items: await this.findItems(id) };
  }

  async findItems(billingRunId: string): Promise<BillingRunItem[]> {
    const rows = await this.db
      .select(this.itemColumns)
      .from(this.billingRunItem)
      .innerJoin(child, eq(child.id, this.billingRunItem.childId))
      .leftJoin(invoice, eq(invoice.id, this.billingRunItem.invoiceId))
      .where(eq(this.billingRunItem.billingRunId, billingRunId))
      .orderBy(asc(child.name), asc(this.billingRunItem.id));

    return rows.map(({ invoiceId, invoiceNumber, ...row }) => ({
      ...row,
      invoice: invoiceId && invoiceNumber ? { id: invoiceId, invoiceNumber } : null,
    }));
  }
}

export const billingRunService = new BillingRunService(db, billingRun, billingRunItem);
