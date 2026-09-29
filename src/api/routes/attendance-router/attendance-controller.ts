import type { Response } from "express";
import type { AttendanceParamsSchema, CheckInSchema, ChildrenCentreAttendancesParamsSchema, FindAttendancesSchema } from "./attendance.request.ts";
import { bindAll } from "@/common/utils";
import type { Req, Staff } from "@/common/types";
import {
  attendanceService,
  childrenCentreService,
  enrollmentService,
  staffService,
  type AttendanceService,
  type ChildrenCentreService,
  type EnrollmentService,
  type StaffService,
} from "@/services";
import { auth } from "@/auth";
import { ORGANIZATION_ID } from "@/common/constants";
import { fromNodeHeaders } from "better-auth/node";
import { currentUser } from "@/api/middlewares/auth.middleware";
import NotFoundError from "@/common/errors/not-found.error";
import BadRequestError from "@/common/errors/bad-request.error";
import ForbiddenError from "@/common/errors/forbidden.error";

class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private enrollmentService: EnrollmentService,
    private staffService: StaffService,
    private childrenCentreService: ChildrenCentreService,
  ) {
    bindAll(this);
  }

  private async currentStaff(req: Req<{ params: ChildrenCentreAttendancesParamsSchema }>, res: Response): Promise<Staff> {
    const user = currentUser(res);

    const { members } = await auth.api.listMembers({
      query: {
        organizationId: ORGANIZATION_ID,
        filterField: "userId",
        filterOperator: "eq",
        filterValue: user.id,
      },
      headers: fromNodeHeaders(req.headers),
    });

    const [member] = members;
    if (!member) throw new ForbiddenError("You are not a member of this organization");

    return this.staffService.findByMemberId(member.id, req.params.childrenCentreId).catch((error) => {
      if (error instanceof NotFoundError) throw new ForbiddenError("You are not a staff member at this children centre");
      throw error;
    });
  }

  async checkIn(req: Req<{ params: ChildrenCentreAttendancesParamsSchema, body: CheckInSchema }>, res: Response) {
    const { childrenCentreId } = req.params;
    const { enrollmentId } = req.body;

    const [staff, enrollment] = await Promise.all([
      this.currentStaff(req, res),
      this.enrollmentService.findOne(enrollmentId, childrenCentreId),
    ]);

    if (enrollment.status !== "active") throw new BadRequestError(`Enrollment ${enrollmentId} is not active`);

    return this.attendanceService.checkIn({ enrollmentId, staffId: staff.id }, childrenCentreId);
  }

  async checkOut(req: Req<{ params: AttendanceParamsSchema }>, res: Response) {
    const { id, childrenCentreId } = req.params;

    const staff = await this.currentStaff(req, res);

    return this.attendanceService.checkOut(id, { staffId: staff.id }, childrenCentreId);
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

export const attendanceController = new AttendanceController(attendanceService, enrollmentService, staffService, childrenCentreService);
