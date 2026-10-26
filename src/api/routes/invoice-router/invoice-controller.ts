import type {
  ChildrenCentreInvoiceParamsSchema,
  CreateInvoiceSchema,
  FindInvoicesSchema,
  FindOverlappingInvoicesSchema,
  InvoiceParamsSchema,
  UpdateInvoiceSchema,
} from "./invoice.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import { BadRequestError } from "@/common/errors";
import {
  childService,
  enrollmentService,
  invoiceService,
  type ChildService,
  type EnrollmentService,
  type InvoiceService,
} from "@/services";

class InvoiceController {
  constructor(
    private invoiceService: InvoiceService,
    private childService: ChildService,
    private enrollmentService: EnrollmentService,
  ) {
    bindAll(this);
  }

  private async billingParentId(childId: string, childrenCentreId: string): Promise<string> {
    const [enrollments, [contact]] = await Promise.all([
      this.enrollmentService.findByChildId(childId),
      this.childService.findBillingContacts([childId]),
    ]);

    if (!enrollments.some(({ childrenCentre }) => childrenCentre.id === childrenCentreId)) {
      throw new BadRequestError(`Child ${childId} is not enrolled at children centre ${childrenCentreId}`);
    }

    if (!contact) throw new BadRequestError(`Child ${childId} has no billing contact`);

    return contact.parentId;
  }

  async find(req: Req<{ params: ChildrenCentreInvoiceParamsSchema; query: FindInvoicesSchema }>) {
    return this.invoiceService.find({
      ...req.query,
      childrenCentreId: req.params.childrenCentreId,
    });
  }

  async findOne(req: Req<{ params: InvoiceParamsSchema }>) {
    const { invoiceId, childrenCentreId } = req.params;

    return this.invoiceService.findOne(invoiceId, { childrenCentreId });
  }

  async findOverlapping(
    req: Req<{ params: ChildrenCentreInvoiceParamsSchema; query: FindOverlappingInvoicesSchema }>,
  ) {
    return this.invoiceService.findOverlapping({
      ...req.query,
      childrenCentreId: req.params.childrenCentreId,
    });
  }

  async create(req: Req<{ params: ChildrenCentreInvoiceParamsSchema; body: CreateInvoiceSchema }>) {
    const { childrenCentreId } = req.params;
    const parentId = await this.billingParentId(req.body.childId, childrenCentreId);

    return this.invoiceService.create({
      ...req.body,
      childrenCentreId,
      parentId,
    });
  }

  async update(req: Req<{ params: InvoiceParamsSchema; body: UpdateInvoiceSchema }>) {
    const { invoiceId, childrenCentreId } = req.params;

    return this.invoiceService.update(invoiceId, childrenCentreId, req.body);
  }

  async issue(req: Req<{ params: InvoiceParamsSchema }>) {
    const { invoiceId, childrenCentreId } = req.params;

    return this.invoiceService.issue(invoiceId, childrenCentreId);
  }

  async void(req: Req<{ params: InvoiceParamsSchema }>) {
    const { invoiceId, childrenCentreId } = req.params;

    return this.invoiceService.void(invoiceId, childrenCentreId);
  }

  async markUncollectible(req: Req<{ params: InvoiceParamsSchema }>) {
    const { invoiceId, childrenCentreId } = req.params;

    return this.invoiceService.markUncollectible(invoiceId, childrenCentreId);
  }

  async remove(req: Req<{ params: InvoiceParamsSchema }>) {
    const { invoiceId, childrenCentreId } = req.params;

    await this.invoiceService.remove(invoiceId, childrenCentreId);
  }
}

export const invoiceController = new InvoiceController(
  invoiceService,
  childService,
  enrollmentService,
);
