import type { Response } from "express";
import type { AttendanceParamsSchema, CheckInSchema, ChildrenCentreAttendancesParamsSchema, FindAttendancesSchema } from "./attendance.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import {
  attendanceService,
  childrenCentreService,
  enrollmentService,
  type AttendanceService,
  type ChildrenCentreService,
  type EnrollmentService,
} from "@/services";
import BadRequestError from "@/common/errors/bad-request.error";
import { currentStaffId } from "@/api/middlewares/auth.middleware";

class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private enrollmentService: EnrollmentService,
    private childrenCentreService: ChildrenCentreService,
  ) {
    bindAll(this);
  }

  async checkIn(req: Req<{ params: ChildrenCentreAttendancesParamsSchema, body: CheckInSchema }>, res: Response) {
    const { childrenCentreId } = req.params;
    const { enrollmentId } = req.body;

    const enrollment = await this.enrollmentService.findOne(enrollmentId, childrenCentreId);

    if (enrollment.status !== "active") throw new BadRequestError(`Enrollment ${enrollmentId} is not active`);

    return this.attendanceService.checkIn({ enrollmentId, staffId: currentStaffId(res) }, childrenCentreId);
  }

  async checkOut(req: Req<{ params: AttendanceParamsSchema }>, res: Response) {
    const { id, childrenCentreId } = req.params;

    return this.attendanceService.checkOut(id, { staffId: currentStaffId(res) }, childrenCentreId);
  }

  async find(req: Req<{ params: ChildrenCentreAttendancesParamsSchema, query: FindAttendancesSchema }>) {
    const { childrenCentreId } = req.params;

    await this.childrenCentreService.findOne(childrenCentreId);

    return this.attendanceService.find({ ...req.query, childrenCentreId });
  }

  async findOne(req: Req<{ params: AttendanceParamsSchema }>) {
    return this.attendanceService.findOne(req.params.id, req.params.childrenCentreId);
  }
}

export const attendanceController = new AttendanceController(attendanceService, enrollmentService, childrenCentreService);
