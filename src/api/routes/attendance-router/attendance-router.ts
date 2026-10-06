import { Router } from "express";
import { attendanceController } from "./attendance-controller";
import { handle } from "@/common/utils/index";
import { requireAuth, authorizationCheck } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  attendanceParamsSchema,
  checkInSchema,
  childrenCentreAttendancesParamsSchema,
  findAttendancesSchema,
} from "./attendance.request";

const attendanceRouter: Router = Router({ mergeParams: true });

attendanceRouter.get(
  "/",
  requireAuth,
  authorizationCheck({
    permissions: {
      attendance: ["list"],
    },
  }),
  validate({
    params: childrenCentreAttendancesParamsSchema,
    query: findAttendancesSchema,
  }),
  handle(attendanceController.find),
);
attendanceRouter.get(
  "/:id",
  requireAuth,
  authorizationCheck({
    permissions: {
      attendance: ["list"],
    },
  }),
  validate({ params: attendanceParamsSchema }),
  handle(attendanceController.findOne),
);
attendanceRouter.post(
  "/",
  requireAuth,
  authorizationCheck({
    permissions: {
      attendance: ["create"],
    },
  }),
  validate({
    params: childrenCentreAttendancesParamsSchema,
    body: checkInSchema,
  }),
  handle(attendanceController.checkIn, 201),
);
attendanceRouter.post(
  "/:id/check-out",
  requireAuth,
  authorizationCheck({
    permissions: {
      attendance: ["update"],
    },
  }),
  validate({ params: attendanceParamsSchema }),
  handle(attendanceController.checkOut),
);

export { attendanceRouter };
