import { Router } from "express";
import { billingRunController } from "./billing-run.controller";
import { handle } from "@/common/utils/index";
import { authorizationCheck } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  billingRunParamsSchema,
  childrenCentreBillingRunParamsSchema,
  findBillingRunsSchema,
  generateInvoicesSchema,
} from "./billing-run.request";

const billingRunRouter: Router = Router({ mergeParams: true });

billingRunRouter.get(
  "/",
  authorizationCheck({
    permissions: {
      billingRun: ["list"],
    },
  }),
  validate({ params: childrenCentreBillingRunParamsSchema, query: findBillingRunsSchema }),
  handle(billingRunController.find),
);

billingRunRouter.get(
  "/:billingRunId",
  authorizationCheck({
    permissions: {
      billingRun: ["list"],
    },
  }),
  validate({ params: billingRunParamsSchema }),
  handle(billingRunController.findOne),
);

billingRunRouter.post(
  "/",
  authorizationCheck({
    permissions: {
      billingRun: ["create"],
    },
  }),
  validate({ params: childrenCentreBillingRunParamsSchema, body: generateInvoicesSchema }),
  handle(billingRunController.generate, 201),
);

export { billingRunRouter };
