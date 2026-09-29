import { Router } from "express";
import { enrollmentController } from "./enrollment-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import { childrenCentreEnrollmentsParamsSchema, createEnrollmentSchema, enrollmentParamsSchema, findEnrollmentsSchema, updateEnrollmentSchema } from "./enrollment.request";

const enrollmentRouter: Router = Router({ mergeParams: true });

enrollmentRouter.get("/", validate({ params: childrenCentreEnrollmentsParamsSchema, query: findEnrollmentsSchema }), handle(enrollmentController.find));
enrollmentRouter.get("/:id", validate({ params: enrollmentParamsSchema }), handle(enrollmentController.findOne));
enrollmentRouter.post("/", validate({ params: childrenCentreEnrollmentsParamsSchema, body: createEnrollmentSchema }), handle(enrollmentController.create, 201));
enrollmentRouter.put("/:id", validate({ params: enrollmentParamsSchema, body: updateEnrollmentSchema }), handle(enrollmentController.update));

export { enrollmentRouter }
