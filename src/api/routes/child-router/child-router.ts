import { Router } from "express";
import { childController } from "./child-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  addChildParentSchema,
  childParamsSchema,
  createChildSchema,
  findChildrenSchema,
  setBillingContactSchema,
  updateChildSchema,
} from "./child.request";
import { authorizationCheck } from "@/api/middlewares";
import { Roles } from "@/auth/plugins/admin";

const childRouter: Router = Router();

childRouter.get(
  "/",
  authorizationCheck({
    permissions: {
      child: ["list"],
    },
  }),
  validate({ query: findChildrenSchema }),
  handle(childController.find),
);
childRouter.get(
  "/:id",
  authorizationCheck({
    permissions: {
      child: ["list"],
    },
  }),
  validate({ params: childParamsSchema }),
  handle(childController.findOne),
);
childRouter.post(
  "/",
  authorizationCheck({
    permissions: {
      child: ["create"],
    },
  }),
  validate({ body: createChildSchema }),
  handle(childController.create, 201),
);
childRouter.put(
  "/:id",
  authorizationCheck({
    permissions: {
      child: ["update"],
    },
  }),
  validate({ params: childParamsSchema, body: updateChildSchema }),
  handle(childController.update),
);
childRouter.post(
  "/:id/parents",
  authorizationCheck({
    permissions: {
      child: ["update"],
    },
  }),
  validate({ params: childParamsSchema, body: addChildParentSchema }),
  handle(childController.addParent, 201),
);
childRouter.put(
  "/:id/billing-contact",
  authorizationCheck({
    permissions: {
      child: ["update"],
    },
  }),
  validate({ params: childParamsSchema, body: setBillingContactSchema }),
  handle(childController.setBillingContact),
);

export { childRouter };
