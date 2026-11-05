import { Router } from "express";
import { enrollmentController } from "./enrollment.controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  childrenCentreEnrollmentsParamsSchema,
  createEnrollmentSchema,
  enrollmentParamsSchema,
  findEnrollmentsSchema,
  findUnenrolledChildrenSchema,
  updateEnrollmentSchema,
} from "./enrollment.request";
import { authorizationCheck } from "@/api/middlewares";

const enrollmentRouter: Router = Router({ mergeParams: true });

enrollmentRouter.get(
  "/",
  authorizationCheck({
    permissions: {
      enrollment: ["list"],
    },
  }),
  validate({
    params: childrenCentreEnrollmentsParamsSchema,
    query: findEnrollmentsSchema,
  }),
  handle(enrollmentController.find),
);
enrollmentRouter.get(
  "/unenrolled",
  authorizationCheck({
    permissions: {
      enrollment: ["list"],
      child: ["list"],
    },
  }),
  validate({
    params: childrenCentreEnrollmentsParamsSchema,
    query: findUnenrolledChildrenSchema,
  }),
  handle(enrollmentController.findUnenrolledChildren),
);
enrollmentRouter.get(
  "/:id",
  authorizationCheck({
    permissions: {
      enrollment: ["list"],
    },
  }),
  validate({ params: enrollmentParamsSchema }),
  handle(enrollmentController.findOne),
);
enrollmentRouter.post(
  "/",
  authorizationCheck({
    permissions: {
      enrollment: ["create"],
    },
  }),
  validate({
    params: childrenCentreEnrollmentsParamsSchema,
    body: createEnrollmentSchema,
  }),
  handle(enrollmentController.create, 201),
);
enrollmentRouter.put(
  "/:id",
  authorizationCheck({
    permissions: {
      enrollment: ["update"],
    },
  }),
  validate({ params: enrollmentParamsSchema, body: updateEnrollmentSchema }),
  handle(enrollmentController.update),
);

export { enrollmentRouter };
