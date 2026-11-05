import { Router } from "express";
import { attendanceController } from "./attendance-controller";
import { handle } from "@/common/utils/index";
import { authorizationCheck } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  attendanceParamsSchema,
  checkInSchema,
  childrenCentreAttendancesParamsSchema,
  findAttendancesSchema,
  findNotCheckedInChildrenSchema,
} from "./attendance.request";

const attendanceRouter: Router = Router({ mergeParams: true });

attendanceRouter.get(
  "/",
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
  "/not-checked-in",
  authorizationCheck({
    permissions: {
      attendance: ["list"],
      child: ["list"],
    },
  }),
  validate({
    params: childrenCentreAttendancesParamsSchema,
    query: findNotCheckedInChildrenSchema,
  }),
  handle(attendanceController.findNotCheckedInChildren),
);
attendanceRouter.get(
  "/:id",
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
  authorizationCheck({
    permissions: {
      attendance: ["update"],
    },
  }),
  validate({ params: attendanceParamsSchema }),
  handle(attendanceController.checkOut),
);

export { attendanceRouter };
