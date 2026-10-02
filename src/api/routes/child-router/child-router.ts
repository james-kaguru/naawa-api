import { Router } from "express";
import { childController } from "./child-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  addChildParentSchema,
  childParamsSchema,
  createChildSchema,
  findChildrenSchema,
  updateChildSchema,
} from "./child.request";
import { requireAuth, authorizationCheck } from "@/api/middlewares";
import { SystemRole } from "@/auth/plugins/admin";

const childRouter: Router = Router();

childRouter.get(
  "/",
  requireAuth,
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
  requireAuth,
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
  requireAuth,
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
  requireAuth,
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
  requireAuth,
  authorizationCheck({
    permissions: {
      child: ["update"],
    },
  }),
  validate({ params: childParamsSchema, body: addChildParentSchema }),
  handle(childController.addParent, 201),
);

export { childRouter };
