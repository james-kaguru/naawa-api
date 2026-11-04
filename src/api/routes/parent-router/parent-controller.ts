import type { Request } from "express";
import type {
  CreateMyChildSchema,
  CreateParentSchema,
  FindParentsSchema,
  ParentChildrenParamsSchema,
  UpdateParentSchema,
} from "./parent.request.ts";
import { bindAll } from "@/common/utils";
import {
  currentParentId,
  currentUser,
} from "../../middlewares/auth.middleware/index.ts";
import type { Req, Res } from "@/common/types";
import {
  activityService,
  attendanceService,
  childService,
  enrollmentService,
  parentService,
  type ActivityService,
  type AttendanceService,
  type ParentService,
  type ChildService,
  type EnrollmentService,
} from "@/services";
import { auth } from "@/auth";
import { ORGANIZATION_ID } from "@/common/constants";
import { fromNodeHeaders } from "better-auth/node";
import { BadRequestError } from "@/common/errors";
import type { UpdateChildSchema } from "../child-router/child.request.ts";
import type { FindChildAttendancesSchema } from "../attendance-router/attendance.request.ts";
import type { FindChildActivitiesSchema } from "../activity-router/activity.request.ts";
import { Role } from "@/auth";

class ParentController {
  constructor(
    private parentService: ParentService,
    private childService: ChildService,
    private enrollmentService: EnrollmentService,
    private attendanceService: AttendanceService,
    private activityService: ActivityService,
  ) {
    bindAll(this);
  }

  async create(req: Req<{ body: CreateParentSchema }>) {
    const body = req.body;

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
        roleName: "parent",
        organizationId: ORGANIZATION_ID,
      },
      headers: fromNodeHeaders(req.headers),
    });

    const member = await auth.api.addMember({
      body: {
        userId: user.id,
        role: "parent" as any,
        organizationId: ORGANIZATION_ID,
      },
    });

    const parent = await this.parentService.create({
      memberId: member.id,
      phoneNumber: body.phoneNumber,
    });

    return parent;
  }

  async find(req: Req<{ query: FindParentsSchema }>) {
    return this.parentService.find(req.query);
  }

  async findOne(req: Req<{ params: { id: string } }>) {
    return this.parentService.findOne(req.params.id);
  }

  async findMyChildren(req: Req, res: Res) {
    const parentId = currentParentId(res);

    const { data } = await this.childService.find({
      paginate: false,
      parentId,
      page: 1,
      perPage: 100,
    });

    return data;
  }

  async createMyChild(req: Req<{ body: CreateMyChildSchema }>, res: Res) {
    const parentId = currentParentId(res);

    return this.childService.create({
      ...req.body,
      parentId,
    });
  }

  async updateMyChild(
    req: Req<{ body: UpdateChildSchema; params: ParentChildrenParamsSchema }>,
    res: Res,
  ) {
    const parentId = currentParentId(res);

    await this.childService.findByParentId(req.params.childId, parentId);

    await this.childService.update(req.params.childId, req.body);
  }

  async findMyChildEnrollments(
    req: Req<{ params: ParentChildrenParamsSchema }>,
    res: Res,
  ) {
    const parentId = currentParentId(res);

    await this.childService.findByParentId(req.params.childId, parentId);

    return this.enrollmentService.findByChildId(req.params.childId);
  }

  async findMyChildAttendances(
    req: Req<{
      params: ParentChildrenParamsSchema;
      query: FindChildAttendancesSchema;
    }>,
    res: Res,
  ) {
    const parentId = currentParentId(res);

    await this.childService.findByParentId(req.params.childId, parentId);

    return this.attendanceService.findByChildId({
      ...req.query,
      childId: req.params.childId,
    });
  }

  async findMyChildActivities(
    req: Req<{
      params: ParentChildrenParamsSchema;
      query: FindChildActivitiesSchema;
    }>,
    res: Res,
  ) {
    const parentId = currentParentId(res);

    await this.childService.findByParentId(req.params.childId, parentId);

    return this.activityService.findByChildId({
      ...req.query,
      childId: req.params.childId,
    });
  }

  async update(req: Req<{ params: { id: string }; body: UpdateParentSchema }>) {
    await this.parentService.findOne(req.params.id);

    if (Object.keys(req.body).length === 0)
      throw new BadRequestError("No values to update");

    if (req.body.name) {
      console.log(fromNodeHeaders(req.headers));
      const userId = await this.parentService.findUserId(req.params.id);

      await auth.api.adminUpdateUser({
        body: {
          userId,
          data: { name: req.body.name },
        },
        headers: fromNodeHeaders(req.headers),
      });
    }

    const parent = await this.parentService.update(req.params.id, {
      emergencyContact: req.body.emergencyContact,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
    });

    return parent;
  }
}

export const parentController = new ParentController(
  parentService,
  childService,
  enrollmentService,
  attendanceService,
  activityService,
);
