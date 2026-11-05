import { Router } from "express";
import { invoiceController } from "./invoice.controller";
import { handle } from "@/common/utils/index";
import { authorizationCheck } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  childrenCentreInvoiceParamsSchema,
  createInvoiceSchema,
  findInvoicesSchema,
  findOverlappingInvoicesSchema,
  invoiceParamsSchema,
  updateInvoiceSchema,
} from "./invoice.request";

const invoiceRouter: Router = Router({ mergeParams: true });

invoiceRouter.get(
  "/",
  authorizationCheck({
    permissions: {
      invoice: ["list"],
    },
  }),
  validate({ params: childrenCentreInvoiceParamsSchema, query: findInvoicesSchema }),
  handle(invoiceController.find),
);

invoiceRouter.get(
  "/overlaps",
  authorizationCheck({
    permissions: {
      invoice: ["create"],
    },
  }),
  validate({
    params: childrenCentreInvoiceParamsSchema,
    query: findOverlappingInvoicesSchema,
  }),
  handle(invoiceController.findOverlapping),
);

invoiceRouter.get(
  "/:invoiceId",
  authorizationCheck({
    permissions: {
      invoice: ["list"],
    },
  }),
  validate({ params: invoiceParamsSchema }),
  handle(invoiceController.findOne),
);

invoiceRouter.post(
  "/",
  authorizationCheck({
    permissions: {
      invoice: ["create"],
    },
  }),
  validate({ params: childrenCentreInvoiceParamsSchema, body: createInvoiceSchema }),
  handle(invoiceController.create, 201),
);

invoiceRouter.put(
  "/:invoiceId",
  authorizationCheck({
    permissions: {
      invoice: ["update"],
    },
  }),
  validate({ params: invoiceParamsSchema, body: updateInvoiceSchema }),
  handle(invoiceController.update),
);

invoiceRouter.post(
  "/:invoiceId/issue",
  authorizationCheck({
    permissions: {
      invoice: ["update"],
    },
  }),
  validate({ params: invoiceParamsSchema }),
  handle(invoiceController.issue),
);

invoiceRouter.post(
  "/:invoiceId/void",
  authorizationCheck({
    permissions: {
      invoice: ["update"],
    },
  }),
  validate({ params: invoiceParamsSchema }),
  handle(invoiceController.void),
);

invoiceRouter.post(
  "/:invoiceId/uncollectible",
  authorizationCheck({
    permissions: {
      invoice: ["update"],
    },
  }),
  validate({ params: invoiceParamsSchema }),
  handle(invoiceController.markUncollectible),
);

invoiceRouter.delete(
  "/:invoiceId",
  authorizationCheck({
    permissions: {
      invoice: ["delete"],
    },
  }),
  validate({ params: invoiceParamsSchema }),
  handle(invoiceController.remove, 204),
);

export { invoiceRouter };
