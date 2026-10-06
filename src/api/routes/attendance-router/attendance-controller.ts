import type { Response } from "express";
import type { AttendanceParamsSchema, CheckInSchema, ChildrenCentreAttendancesParamsSchema, FindAttendancesSchema, FindNotCheckedInChildrenSchema } from "./attendance.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import {
  attendanceService,
  childService,
  childrenCentreService,
  enrollmentService,
  type AttendanceService,
  type ChildService,
  type ChildrenCentreService,
  type EnrollmentService,
} from "@/services";
import { currentStaffId } from "@/api/middlewares/auth.middleware";

class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private enrollmentService: EnrollmentService,
    private childrenCentreService: ChildrenCentreService,
    private childService: ChildService,
  ) {
    bindAll(this);
  }

  async checkIn(req: Req<{ params: ChildrenCentreAttendancesParamsSchema, body: CheckInSchema }>, res: Response) {
    const { childrenCentreId } = req.params;
    const { childIds } = req.body;

    const enrollments = await this.enrollmentService.findActiveByChildIds(childIds, childrenCentreId);

    return this.attendanceService.checkIn({ enrollmentIds: enrollments.map((enrollment) => enrollment.id), staffId: currentStaffId(res) }, childrenCentreId);
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

  async findNotCheckedInChildren(req: Req<{ params: ChildrenCentreAttendancesParamsSchema, query: FindNotCheckedInChildrenSchema }>) {
    const { childrenCentreId } = req.params;

    await this.childrenCentreService.findOne(childrenCentreId);

    return this.childService.findNotCheckedIn({ ...req.query, childrenCentreId });
  }

  async findOne(req: Req<{ params: AttendanceParamsSchema }>) {
    return this.attendanceService.findOne(req.params.id, req.params.childrenCentreId);
  }
}

export const attendanceController = new AttendanceController(attendanceService, enrollmentService, childrenCentreService, childService);
