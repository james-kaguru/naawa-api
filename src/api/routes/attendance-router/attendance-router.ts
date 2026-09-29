import { Router } from "express";
import { attendanceController } from "./attendance-controller";
import { handle } from "@/common/utils/index";
import { requireAuth } from "@/api/middlewares/auth.middleware";
import { validate } from "@/api/middlewares/validate.middleware";
import { attendanceParamsSchema, checkInSchema, childrenCentreAttendancesParamsSchema, findAttendancesSchema } from "./attendance.request";

const attendanceRouter: Router = Router({ mergeParams: true });

attendanceRouter.get("/", validate({ params: childrenCentreAttendancesParamsSchema, query: findAttendancesSchema }), handle(attendanceController.find));
attendanceRouter.get("/:id", validate({ params: attendanceParamsSchema }), handle(attendanceController.findOne));
attendanceRouter.post("/", requireAuth, validate({ params: childrenCentreAttendancesParamsSchema, body: checkInSchema }), handle(attendanceController.checkIn, 201));
attendanceRouter.post("/:id/check-out", requireAuth, validate({ params: attendanceParamsSchema }), handle(attendanceController.checkOut));

export { attendanceRouter }
