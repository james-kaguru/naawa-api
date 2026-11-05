import type {
  BillingRunParamsSchema,
  ChildrenCentreBillingRunParamsSchema,
  FindBillingRunsSchema,
  GenerateInvoicesSchema,
} from "./billing-run.request.ts";
import { bindAll } from "@/common/utils";
import type { Req, Res } from "@/common/types";
import {
  billingRunService,
  billingService,
  type BillingRunService,
  type BillingService,
} from "@/services";
import { currentStaffId } from "@/api/middlewares/auth.middleware";

class BillingRunController {
  constructor(
    private billingService: BillingService,
    private billingRunService: BillingRunService,
  ) {
    bindAll(this);
  }

  async generate(
    req: Req<{ params: ChildrenCentreBillingRunParamsSchema; body: GenerateInvoicesSchema }>,
    res: Res,
  ) {
    return this.billingService.generate({
      ...req.body,
      childrenCentreId: req.params.childrenCentreId,
      createdByStaffId: currentStaffId(res),
    });
  }

  async find(req: Req<{ params: ChildrenCentreBillingRunParamsSchema; query: FindBillingRunsSchema }>) {
    return this.billingRunService.find(req.params.childrenCentreId, req.query);
  }

  async findOne(req: Req<{ params: BillingRunParamsSchema }>) {
    const { billingRunId, childrenCentreId } = req.params;

    return this.billingRunService.findOne(billingRunId, childrenCentreId);
  }
}

export const billingRunController = new BillingRunController(
  billingService,
  billingRunService,
);
