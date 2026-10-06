import type { ChildrenCentreStaffParamsSchema, CreateStaffSchema, FindStaffSchema, StaffParamsSchema } from "./staff.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import { activityService, attendanceService, childrenCentreService, staffService, type ActivityService, type AttendanceService, type ChildrenCentreService, type StaffService } from "@/services";
import { auth } from "@/auth";
import { ORGANIZATION_ID } from "@/common/constants";
import { fromNodeHeaders } from "better-auth/node";
import { BadRequestError, NotFoundError } from "@/common/errors";

class StaffController {
  constructor(private staffService: StaffService, private childrenCentreService: ChildrenCentreService, private attendanceService: AttendanceService, private activityService: ActivityService) {
    bindAll(this);
  }

  async create(req: Req<{ params: ChildrenCentreStaffParamsSchema, body: CreateStaffSchema }>) {
    const { childrenCentreId } = req.params;
    const { memberId } = req.body;

    const [, { members }] = await Promise.all([
      this.childrenCentreService.findOne(childrenCentreId),
      auth.api.listMembers({
        query: {
          organizationId: ORGANIZATION_ID,
          filterField: "id",
          filterOperator: "eq",
          filterValue: memberId,
        },
        headers: fromNodeHeaders(req.headers),
      }),
    ]);

    if (!members.length) throw new NotFoundError(`Member ${memberId} not found`)

    return this.staffService.create({
      memberId,
      childrenCentreId,
    });
  }

  async find(req: Req<{ params: ChildrenCentreStaffParamsSchema, query: FindStaffSchema }>) {
    const { childrenCentreId } = req.params;

    await this.childrenCentreService.findOne(childrenCentreId);

    return this.staffService.find({ ...req.query, childrenCentreId });
  }

  async findOne(req: Req<{ params: StaffParamsSchema }>) {
    return this.staffService.findOne(req.params.id, req.params.childrenCentreId);
  }

  async remove(req: Req<{ params: StaffParamsSchema }>) {
    const { id, childrenCentreId } = req.params;

    await this.staffService.findOne(id, childrenCentreId);

    const [hasAttendances, hasActivities] = await Promise.all([
      this.attendanceService.existsByStaffId(id),
      this.activityService.existsByStaffId(id),
    ]);

    if (hasAttendances || hasActivities) throw new BadRequestError(`Staff ${id} has attendance or activity records and cannot be removed`)

    return this.staffService.remove(id, childrenCentreId);
  }
}

export const staffController = new StaffController(staffService, childrenCentreService, attendanceService, activityService);
