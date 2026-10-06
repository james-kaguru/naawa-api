import { Router } from "express";
import { childrenCentreController } from "./children-centre-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  childrenCentreParamsSchema,
  createChildrenCentreSchema,
  findChildrenCentresSchema,
  updateChildrenCentreSchema,
} from "./children-centre.request";
import { requireAuth, authorizationCheck } from "@/api/middlewares";

const childrenCentreRouter: Router = Router();

childrenCentreRouter.get(
  "/",
  requireAuth,
  authorizationCheck({
    permissions: {
      childrenCentre: ["list"],
    },
  }),
  validate({ query: findChildrenCentresSchema }),
  handle(childrenCentreController.find),
);
childrenCentreRouter.get(
  "/:id",
  requireAuth,
  authorizationCheck({
    permissions: {
      childrenCentre: ["list"],
    },
  }),
  validate({ params: childrenCentreParamsSchema }),
  handle(childrenCentreController.findOne),
);
childrenCentreRouter.post(
  "/",
  requireAuth,
  authorizationCheck({
    permissions: {
      childrenCentre: ["create"],
    },
  }),
  validate({ body: createChildrenCentreSchema }),
  handle(childrenCentreController.create, 201),
);
childrenCentreRouter.put(
  "/:id",
  requireAuth,
  authorizationCheck({
    permissions: {
      childrenCentre: ["update"],
    },
  }),
  validate({
    params: childrenCentreParamsSchema,
    body: updateChildrenCentreSchema,
  }),
  handle(childrenCentreController.update),
);

export { childrenCentreRouter };
