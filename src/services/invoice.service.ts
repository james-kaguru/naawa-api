import { and, count, desc, eq, gte, inArray, lte, ne, sql, type SQL } from "drizzle-orm";
import { db, type Db, type DbExecutor, type Tx } from "@/db";
import {
  child,
  childrenCentre,
  invoice,
  invoiceItem,
  parent,
  type InvoiceItemTable,
  type InvoiceStatus,
  type InvoiceTable,
} from "@/db/schema";
import { member, user } from "@/db/schema/auth.schema";
import { BadRequestError, ConflictError, NotFoundError } from "@/common/errors";
import type {
  Invoice,
  InvoiceItem,
  OverlappingInvoice,
  PaginationServiceResponse,
  PlainInvoice,
} from "@/common/types";
import type { PaginationQuery } from "@/api/schemas";

export interface CreateInvoiceItem {
  description: string;
  quantity: number;
  unitAmount: number;
}

export interface CreateInvoice {
  childrenCentreId: string;
  childId: string;
  parentId: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  tax?: number | undefined;
  notes?: string | undefined;
  items: CreateInvoiceItem[];
  confirmOverlap?: boolean | undefined;
}

export interface InvoicePeriod {
  childrenCentreId: string;
  childId: string;
  periodStart: string;
  periodEnd: string;
}

export interface CreatePeriodInvoices {
  childrenCentreId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  currency: string;
  description: string;
  amount: number;
  invoices: { childId: string; parentId: string }[];
}

export interface PeriodInvoice {
  childId: string;
  invoiceId: string;
  invoiceNumber: string;
}

export interface PeriodInvoices {
  created: PeriodInvoice[];
  skipped: PeriodInvoice[];
}

export type UpdateInvoice = {
  currency?: string | undefined;
  dueDate?: string | undefined;
  tax?: number | undefined;
  notes?: string | undefined;
  items?: CreateInvoiceItem[] | undefined;
};

export interface InvoiceScope {
  childrenCentreId?: string | undefined;
  parentId?: string | undefined;
}

export type FindInvoices = PaginationQuery &
  InvoiceScope & {
    childId?: string | undefined;
    periodStart?: string | undefined;
    status?: InvoiceStatus | undefined;
  };

export class InvoiceService {
  constructor(
    private db: Db,
    private invoice: InvoiceTable,
    private invoiceItem: InvoiceItemTable,
  ) {}

  private get columns() {
    return {
      id: this.invoice.id,
      invoiceNumber: this.invoice.invoiceNumber,
      status: this.invoice.status,
      currency: this.invoice.currency,
      subtotal: this.invoice.subtotal,
      tax: this.invoice.tax,
      total: this.invoice.total,
      amountPaid: this.invoice.amountPaid,
      notes: this.invoice.notes,
      periodStart: this.invoice.periodStart,
      periodEnd: this.invoice.periodEnd,
      dueDate: this.invoice.dueDate,
      issuedAt: this.invoice.issuedAt,
      paidAt: this.invoice.paidAt,
      voidedAt: this.invoice.voidedAt,
      childrenCentre: { id: childrenCentre.id, name: childrenCentre.name },
      child: { id: child.id, name: child.name },
      parent: { id: parent.id, name: user.name },
      createdAt: this.invoice.createdAt,
      updatedAt: this.invoice.updatedAt,
    };
  }

  private get itemColumns() {
    return {
      id: this.invoiceItem.id,
      description: this.invoiceItem.description,
      quantity: this.invoiceItem.quantity,
      unitAmount: this.invoiceItem.unitAmount,
      amount: this.invoiceItem.amount,
    };
  }

  private select() {
    return this.db
      .select(this.columns)
      .from(this.invoice)
      .innerJoin(
        childrenCentre,
        eq(childrenCentre.id, this.invoice.childrenCentreId),
      )
      .innerJoin(child, eq(child.id, this.invoice.childId))
      .innerJoin(parent, eq(parent.id, this.invoice.parentId))
      .innerJoin(member, eq(member.id, parent.memberId))
      .innerJoin(user, eq(user.id, member.userId));
  }

  private filters({ childrenCentreId, parentId, childId, periodStart, status }: Omit<FindInvoices, keyof PaginationQuery>) {
    const filters: SQL[] = [];
    if (childrenCentreId) filters.push(eq(this.invoice.childrenCentreId, childrenCentreId));
    if (parentId) filters.push(eq(this.invoice.parentId, parentId));
    if (childId) filters.push(eq(this.invoice.childId, childId));
    if (periodStart) filters.push(eq(this.invoice.periodStart, periodStart));
    if (status) filters.push(eq(this.invoice.status, status));

    return and(...filters);
  }

  private async lockNumbering(tx: Tx, childrenCentreId: string): Promise<number> {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${childrenCentreId}))`);

    const [res] = await tx
      .select({
        last: sql<number>`coalesce(max(substring(${this.invoice.invoiceNumber} from '[0-9]+$')::int), 0)`,
      })
      .from(this.invoice)
      .where(eq(this.invoice.childrenCentreId, childrenCentreId));

    return res?.last ?? 0;
  }

  private invoiceNumber(sequence: number): string {
    return `INV-${String(sequence).padStart(6, "0")}`;
  }

  private async insertItems(tx: Tx, invoiceId: string, items: CreateInvoiceItem[]) {
    if (!items.length) return;

    await tx.insert(this.invoiceItem).values(
      items.map(({ description, quantity, unitAmount }) => ({
        invoiceId,
        description,
        quantity,
        unitAmount,
        amount: quantity * unitAmount,
      })),
    );
  }

  private async recalculate(tx: Tx, id: string, tax: number) {
    const [res] = await tx
      .select({ subtotal: sql<number>`coalesce(sum(${this.invoiceItem.amount}), 0)::int` })
      .from(this.invoiceItem)
      .where(eq(this.invoiceItem.invoiceId, id));

    const subtotal = res?.subtotal ?? 0;

    return { subtotal, tax, total: subtotal + tax };
  }

  private async lock(tx: Tx, id: string, childrenCentreId: string) {
    const [res] = await tx
      .select({
        status: this.invoice.status,
        tax: this.invoice.tax,
        total: this.invoice.total,
        amountPaid: this.invoice.amountPaid,
      })
      .from(this.invoice)
      .where(and(eq(this.invoice.id, id), eq(this.invoice.childrenCentreId, childrenCentreId)))
      .limit(1)
      .for("update");

    if (!res) throw new NotFoundError(`Invoice ${id} not found`);

    return res;
  }

  private async lockDraft(tx: Tx, id: string, childrenCentreId: string) {
    const current = await this.lock(tx, id, childrenCentreId);

    if (current.status !== "draft") throw new BadRequestError(`Invoice ${id} is ${current.status} and can no longer be edited`);

    return current;
  }

  private async findForPeriod(
    executor: DbExecutor,
    childrenCentreId: string,
    periodStart: string,
    periodEnd: string,
    childIds: string[],
  ): Promise<PeriodInvoice[]> {
    if (!childIds.length) return [];

    const res = await executor
      .select({
        childId: this.invoice.childId,
        invoiceId: this.invoice.id,
        invoiceNumber: this.invoice.invoiceNumber,
      })
      .from(this.invoice)
      .where(
        and(
          eq(this.invoice.childrenCentreId, childrenCentreId),
          eq(this.invoice.periodStart, periodStart),
          eq(this.invoice.periodEnd, periodEnd),
          inArray(this.invoice.childId, childIds),
          ne(this.invoice.status, "void"),
        ),
      )
      .orderBy(this.invoice.createdAt);

    return [...new Map(res.map((row) => [row.childId, row])).values()];
  }

  async findOverlapping(
    { childrenCentreId, childId, periodStart, periodEnd }: InvoicePeriod,
    executor: DbExecutor = this.db,
  ): Promise<OverlappingInvoice[]> {
    return executor
      .select({
        id: this.invoice.id,
        invoiceNumber: this.invoice.invoiceNumber,
        status: this.invoice.status,
        periodStart: this.invoice.periodStart,
        periodEnd: this.invoice.periodEnd,
        total: this.invoice.total,
      })
      .from(this.invoice)
      .where(
        and(
          eq(this.invoice.childrenCentreId, childrenCentreId),
          eq(this.invoice.childId, childId),
          ne(this.invoice.status, "void"),
          lte(this.invoice.periodStart, periodEnd),
          gte(this.invoice.periodEnd, periodStart),
        ),
      )
      .orderBy(this.invoice.periodStart, this.invoice.invoiceNumber);
  }

  async create({
    childrenCentreId,
    childId,
    parentId,
    currency,
    periodStart,
    periodEnd,
    dueDate,
    tax = 0,
    notes = "",
    items,
    confirmOverlap = false,
  }: CreateInvoice): Promise<Invoice> {
    if (periodEnd < periodStart) throw new BadRequestError("periodEnd cannot be before periodStart");

    const id = await this.db.transaction(async (tx) => {
      const last = await this.lockNumbering(tx, childrenCentreId);

      if (!confirmOverlap) {
        const overlappingInvoices = await this.findOverlapping({ childrenCentreId, childId, periodStart, periodEnd }, tx);

        if (overlappingInvoices.length) {
          throw new ConflictError(
            `Child ${childId} already has ${overlappingInvoices.length} invoice(s) overlapping ${periodStart} to ${periodEnd}`,
          );
        }
      }

      const [res] = await tx
        .insert(this.invoice)
        .values({
          invoiceNumber: this.invoiceNumber(last + 1),
          childrenCentreId,
          childId,
          parentId,
          currency,
          periodStart,
          periodEnd,
          dueDate,
          notes,
          tax,
          total: tax,
        })
        .returning({ id: this.invoice.id });

      await this.insertItems(tx, res!.id, items);

      await tx
        .update(this.invoice)
        .set(await this.recalculate(tx, res!.id, tax))
        .where(eq(this.invoice.id, res!.id));

      return res!.id;
    });

    return this.findOne(id, { childrenCentreId });
  }

  async createForPeriod(
    tx: Tx,
    {
      childrenCentreId,
      periodStart,
      periodEnd,
      dueDate,
      currency,
      description,
      amount,
      invoices,
    }: CreatePeriodInvoices,
  ): Promise<PeriodInvoices> {
    if (periodEnd < periodStart) throw new BadRequestError("periodEnd cannot be before periodStart");

    const childIds = invoices.map(({ childId }) => childId);
    if (new Set(childIds).size !== childIds.length) throw new BadRequestError("Each child can only be invoiced once per period");

    const last = await this.lockNumbering(tx, childrenCentreId);

    const skipped = await this.findForPeriod(tx, childrenCentreId, periodStart, periodEnd, childIds);
    const skippedChildIds = new Set(skipped.map(({ childId }) => childId));
    const pending = invoices.filter(({ childId }) => !skippedChildIds.has(childId));

    if (!pending.length) return { created: [], skipped };

    const created = await tx
      .insert(this.invoice)
      .values(
        pending.map(({ childId, parentId }, index) => ({
          invoiceNumber: this.invoiceNumber(last + index + 1),
          childrenCentreId,
          childId,
          parentId,
          currency,
          periodStart,
          periodEnd,
          dueDate,
          subtotal: amount,
          total: amount,
        })),
      )
      .returning({
        childId: this.invoice.childId,
        invoiceId: this.invoice.id,
        invoiceNumber: this.invoice.invoiceNumber,
      });

    await tx.insert(this.invoiceItem).values(
      created.map(({ invoiceId }) => ({
        invoiceId,
        description,
        quantity: 1,
        unitAmount: amount,
        amount,
      })),
    );

    return { created, skipped };
  }

  async find({
    page,
    perPage,
    paginate,
    ...filters
  }: FindInvoices): Promise<PaginationServiceResponse<PlainInvoice>> {
    const where = this.filters(filters);

    const query = this.select()
      .where(where)
      .orderBy(desc(this.invoice.createdAt), desc(this.invoice.id));

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
      this.db.select({ totalCount: count() }).from(this.invoice).where(where),
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

  async findOne(id: string, { childrenCentreId, parentId }: InvoiceScope = {}): Promise<Invoice> {
    const [res] = await this.select()
      .where(
        and(
          eq(this.invoice.id, id),
          childrenCentreId ? eq(this.invoice.childrenCentreId, childrenCentreId) : undefined,
          parentId ? eq(this.invoice.parentId, parentId) : undefined,
        ),
      )
      .limit(1);

    if (!res) throw new NotFoundError(`Invoice ${id} not found`);

    return { ...res, items: await this.findItems(id) };
  }

  async findItems(invoiceId: string): Promise<InvoiceItem[]> {
    return this.db
      .select(this.itemColumns)
      .from(this.invoiceItem)
      .where(eq(this.invoiceItem.invoiceId, invoiceId))
      .orderBy(this.invoiceItem.createdAt, this.invoiceItem.id);
  }

  async update(
    id: string,
    childrenCentreId: string,
    { currency, dueDate, tax, notes, items }: UpdateInvoice,
  ): Promise<Invoice> {
    await this.db.transaction(async (tx) => {
      const current = await this.lockDraft(tx, id, childrenCentreId);

      if (items) {
        await tx.delete(this.invoiceItem).where(eq(this.invoiceItem.invoiceId, id));
        await this.insertItems(tx, id, items);
      }

      await tx
        .update(this.invoice)
        .set({
          currency,
          dueDate,
          notes,
          ...(await this.recalculate(tx, id, tax ?? current.tax)),
        })
        .where(eq(this.invoice.id, id));
    });

    return this.findOne(id, { childrenCentreId });
  }

  async issue(id: string, childrenCentreId: string): Promise<Invoice> {
    await this.db.transaction(async (tx) => {
      const current = await this.lockDraft(tx, id, childrenCentreId);

      if (current.total <= 0) throw new BadRequestError(`Invoice ${id} has no amount to bill`);

      await tx
        .update(this.invoice)
        .set({ status: "open", issuedAt: new Date() })
        .where(eq(this.invoice.id, id));
    });

    return this.findOne(id, { childrenCentreId });
  }

  async void(id: string, childrenCentreId: string): Promise<Invoice> {
    await this.db.transaction(async (tx) => {
      const current = await this.lock(tx, id, childrenCentreId);

      if (current.status !== "open") throw new BadRequestError(`Only open invoices can be voided, invoice ${id} is ${current.status}`);
      if (current.amountPaid > 0) throw new BadRequestError(`Invoice ${id} has payments, refund them before voiding`);

      await tx
        .update(this.invoice)
        .set({ status: "void", voidedAt: new Date() })
        .where(eq(this.invoice.id, id));
    });

    return this.findOne(id, { childrenCentreId });
  }

  async markUncollectible(id: string, childrenCentreId: string): Promise<Invoice> {
    await this.db.transaction(async (tx) => {
      const current = await this.lock(tx, id, childrenCentreId);

      if (current.status !== "open") throw new BadRequestError(`Only open invoices can be marked uncollectible, invoice ${id} is ${current.status}`);

      await tx
        .update(this.invoice)
        .set({ status: "uncollectible" })
        .where(eq(this.invoice.id, id));
    });

    return this.findOne(id, { childrenCentreId });
  }

  async remove(id: string, childrenCentreId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.lockDraft(tx, id, childrenCentreId);

      await tx.delete(this.invoiceItem).where(eq(this.invoiceItem.invoiceId, id));
      await tx.delete(this.invoice).where(eq(this.invoice.id, id));
    });
  }

  async applyPayment(id: string, amount: number, executor: DbExecutor = this.db): Promise<void> {
    const settled = sql`${this.invoice.amountPaid} + ${amount} >= ${this.invoice.total}`;

    const [res] = await executor
      .update(this.invoice)
      .set({
        amountPaid: sql`${this.invoice.amountPaid} + ${amount}`,
        status: sql`case when ${settled} then 'paid'::invoice_status else ${this.invoice.status} end`,
        paidAt: sql`case when ${settled} then coalesce(${this.invoice.paidAt}, now()) else ${this.invoice.paidAt} end`,
      })
      .where(
        and(
          eq(this.invoice.id, id),
          inArray(this.invoice.status, ["open", "uncollectible", "paid"]),
        ),
      )
      .returning({ id: this.invoice.id });

    if (!res) throw new BadRequestError(`Invoice ${id} cannot accept payments`);
  }

  async applyRefund(id: string, amount: number, executor: DbExecutor = this.db): Promise<void> {
    const [res] = await executor
      .update(this.invoice)
      .set({ amountPaid: sql`${this.invoice.amountPaid} - ${amount}` })
      .where(
        and(
          eq(this.invoice.id, id),
          sql`${this.invoice.amountPaid} >= ${amount}`,
        ),
      )
      .returning({ id: this.invoice.id });

    if (!res) throw new BadRequestError(`Refund of ${amount} exceeds the amount paid on invoice ${id}`);
  }
}

export const invoiceService = new InvoiceService(db, invoice, invoiceItem);
