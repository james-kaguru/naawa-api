import type {
  ChildrenCentreStaffParamsSchema,
  CreateStaffSchema,
  FindStaffSchema,
  StaffParamsSchema,
} from "./staff.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import {
  activityService,
  attendanceService,
  childrenCentreService,
  staffService,
  type ActivityService,
  type AttendanceService,
  type ChildrenCentreService,
  type StaffService,
} from "@/services";
import { auth, Role } from "@/auth";
import { ORGANIZATION_ID } from "@/common/constants";
import { fromNodeHeaders } from "better-auth/node";
import { BadRequestError, NotFoundError } from "@/common/errors";

class StaffController {
  constructor(
    private staffService: StaffService,
    private childrenCentreService: ChildrenCentreService,
    private attendanceService: AttendanceService,
    private activityService: ActivityService,
  ) {
    bindAll(this);
  }

  async create(
    req: Req<{
      params: ChildrenCentreStaffParamsSchema;
      body: CreateStaffSchema;
    }>,
  ) {
    const body = req.body;

    const { childrenCentreId } = req.params;

    const { user } = await auth.api.createUser({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
        role: Role.user,
      },
    });

    await auth.api.getOrgRole({
      query: {
        roleName: body.roleName,
        organizationId: ORGANIZATION_ID,
      },
      headers: fromNodeHeaders(req.headers),
    });

    const member = await auth.api.addMember({
      body: {
        userId: user.id,
        role: body.roleName as any,
        organizationId: ORGANIZATION_ID,
      },
    });

    await this.childrenCentreService.findOne(childrenCentreId);

    return this.staffService.create({
      memberId: member.id,
      childrenCentreId,
    });
  }

  async find(
    req: Req<{
      params: ChildrenCentreStaffParamsSchema;
      query: FindStaffSchema;
    }>,
  ) {
    const { childrenCentreId } = req.params;

    await this.childrenCentreService.findOne(childrenCentreId);

    return this.staffService.find({ ...req.query, childrenCentreId });
  }

  async findOne(req: Req<{ params: StaffParamsSchema }>) {
    return this.staffService.findOne(
      req.params.id,
      req.params.childrenCentreId,
    );
  }

  async remove(req: Req<{ params: StaffParamsSchema }>) {
    const { id, childrenCentreId } = req.params;

    await this.staffService.findOne(id, childrenCentreId);

    const [hasAttendances, hasActivities] = await Promise.all([
      this.attendanceService.existsByStaffId(id),
      this.activityService.existsByStaffId(id),
    ]);

    if (hasAttendances || hasActivities)
      throw new BadRequestError(
        `Staff ${id} has attendance or activity records and cannot be removed`,
      );

    return this.staffService.remove(id, childrenCentreId);
  }
}

export const staffController = new StaffController(
  staffService,
  childrenCentreService,
  attendanceService,
  activityService,
);
