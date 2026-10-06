import { Router } from "express";
import { enrollmentController } from "./enrollment-controller";
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
import { requireAuth, authorizationCheck } from "@/api/middlewares";

const enrollmentRouter: Router = Router({ mergeParams: true });

enrollmentRouter.get(
  "/",
  requireAuth,
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
  requireAuth,
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
  requireAuth,
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
  requireAuth,
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
  requireAuth,
  authorizationCheck({
    permissions: {
      enrollment: ["update"],
    },
  }),
  validate({ params: enrollmentParamsSchema, body: updateEnrollmentSchema }),
  handle(enrollmentController.update),
);

export { enrollmentRouter };
