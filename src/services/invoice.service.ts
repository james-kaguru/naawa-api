import { and, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db, type Db, type DbExecutor, type Tx } from "@/db";
import {
  childrenCentre,
  invoice,
  invoiceItem,
  parent,
  type InvoiceItemTable,
  type InvoiceStatus,
  type InvoiceTable,
} from "@/db/schema";
import { member, user } from "@/db/schema/auth.schema";
import { BadRequestError, NotFoundError } from "@/common/errors";
import type {
  Invoice,
  InvoiceItem,
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
  parentId: string;
  currency: string;
  dueDate: string;
  tax?: number | undefined;
  notes?: string | undefined;
  items: CreateInvoiceItem[];
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
      dueDate: this.invoice.dueDate,
      issuedAt: this.invoice.issuedAt,
      paidAt: this.invoice.paidAt,
      voidedAt: this.invoice.voidedAt,
      childrenCentre: { id: childrenCentre.id, name: childrenCentre.name },
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
      .innerJoin(parent, eq(parent.id, this.invoice.parentId))
      .innerJoin(member, eq(member.id, parent.memberId))
      .innerJoin(user, eq(user.id, member.userId));
  }

  private filters({ childrenCentreId, parentId, status }: Omit<FindInvoices, keyof PaginationQuery>) {
    const filters: SQL[] = [];
    if (childrenCentreId) filters.push(eq(this.invoice.childrenCentreId, childrenCentreId));
    if (parentId) filters.push(eq(this.invoice.parentId, parentId));
    if (status) filters.push(eq(this.invoice.status, status));

    return and(...filters);
  }

  private async nextInvoiceNumber(tx: Tx, childrenCentreId: string): Promise<string> {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${childrenCentreId}))`);

    const [res] = await tx
      .select({
        last: sql<number>`coalesce(max(substring(${this.invoice.invoiceNumber} from '[0-9]+$')::int), 0)`,
      })
      .from(this.invoice)
      .where(eq(this.invoice.childrenCentreId, childrenCentreId));

    return `INV-${String((res?.last ?? 0) + 1).padStart(6, "0")}`;
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

  async create({
    childrenCentreId,
    parentId,
    currency,
    dueDate,
    tax = 0,
    notes = "",
    items,
  }: CreateInvoice): Promise<Invoice> {
    const id = await this.db.transaction(async (tx) => {
      const invoiceNumber = await this.nextInvoiceNumber(tx, childrenCentreId);

      const [res] = await tx
        .insert(this.invoice)
        .values({
          invoiceNumber,
          childrenCentreId,
          parentId,
          currency,
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
