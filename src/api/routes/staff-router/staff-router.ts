import { Router } from "express";
import { staffController } from "./staff-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  childrenCentreStaffParamsSchema,
  createStaffSchema,
  findStaffSchema,
  staffParamsSchema,
} from "./staff.request";
import { authorizationCheck } from "@/api/middlewares";

const staffRouter: Router = Router({ mergeParams: true });

staffRouter.get(
  "/",
  authorizationCheck({
    permissions: {
      staff: ["list"],
    },
  }),
  validate({ params: childrenCentreStaffParamsSchema, query: findStaffSchema }),
  handle(staffController.find),
);
staffRouter.get(
  "/:id",
  authorizationCheck({
    permissions: {
      staff: ["list"],
    },
  }),
  validate({ params: staffParamsSchema }),
  handle(staffController.findOne),
);
staffRouter.post(
  "/",
  authorizationCheck({
    permissions: {
      staff: ["create"],
    },
  }),
  validate({ params: childrenCentreStaffParamsSchema, body: createStaffSchema }),
  handle(staffController.create, 201),
);
staffRouter.delete(
  "/:id",
  authorizationCheck({
    permissions: {
      staff: ["delete"],
    },
  }),
  validate({ params: staffParamsSchema }),
  handle(staffController.remove),
);

export { staffRouter };
