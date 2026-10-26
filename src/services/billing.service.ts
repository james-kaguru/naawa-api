import { db, type Db } from "@/db";
import { BadRequestError } from "@/common/errors";
import type { BillingRun } from "@/common/types";
import { invoiceService, type InvoiceService } from "./invoice.service";
import {
  billingRunService,
  type BillingRunService,
  type CreateBillingRunItem,
} from "./billing-run.service";
import { childService, type ChildService } from "./child.service";
import { enrollmentService, type EnrollmentService } from "./enrollment.service";

export interface GenerateInvoices {
  childrenCentreId: string;
  createdByStaffId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  currency: string;
  description: string;
  amount: number;
}

export class BillingService {
  constructor(
    private db: Db,
    private invoiceService: InvoiceService,
    private billingRunService: BillingRunService,
    private childService: ChildService,
    private enrollmentService: EnrollmentService,
  ) {}

  async generate({
    childrenCentreId,
    createdByStaffId,
    periodStart,
    periodEnd,
    dueDate,
    currency,
    description,
    amount,
  }: GenerateInvoices): Promise<BillingRun> {
    if (periodEnd < periodStart) throw new BadRequestError("periodEnd cannot be before periodStart");

    const childIds = [...new Set(await this.enrollmentService.findActiveChildIds(childrenCentreId, periodEnd))];
    if (!childIds.length) throw new BadRequestError(`No children are actively enrolled for the period ${periodStart} to ${periodEnd}`);

    const contacts = await this.childService.findBillingContacts(childIds);
    const parentByChild = new Map(contacts.map(({ childId, parentId }) => [childId, parentId]));

    const billable = childIds.flatMap((childId) => {
      const parentId = parentByChild.get(childId);

      return parentId ? [{ childId, parentId }] : [];
    });

    const failed: CreateBillingRunItem[] = childIds
      .filter((childId) => !parentByChild.has(childId))
      .map((childId) => ({ childId, outcome: "failed", reason: "No billing contact" }));

    const id = await this.db.transaction(async (tx) => {
      const { created, skipped } = await this.invoiceService.createForPeriod(tx, {
        childrenCentreId,
        periodStart,
        periodEnd,
        dueDate,
        currency,
        description,
        amount,
        invoices: billable,
      });

      return this.billingRunService.create(
        {
          childrenCentreId,
          createdByStaffId,
          periodStart,
          periodEnd,
          dueDate,
          currency,
          description,
          amount,
          items: [
            ...created.map(({ childId, invoiceId }): CreateBillingRunItem => ({
              childId,
              outcome: "created",
              invoiceId,
            })),
            ...skipped.map(({ childId, invoiceId, invoiceNumber }): CreateBillingRunItem => ({
              childId,
              outcome: "skipped",
              invoiceId,
              reason: `Already invoiced (${invoiceNumber})`,
            })),
            ...failed,
          ],
        },
        tx,
      );
    });

    return this.billingRunService.findOne(id, childrenCentreId);
  }
}

export const billingService = new BillingService(
  db,
  invoiceService,
  billingRunService,
  childService,
  enrollmentService,
);
