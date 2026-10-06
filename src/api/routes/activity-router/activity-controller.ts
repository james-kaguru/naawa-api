import type { Response } from "express";
import type { ActivityParamsSchema, ChildrenCentreActivitiesParamsSchema, CreateActivitySchema, FindActivitiesSchema, UpdateActivitySchema } from "./activity.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import {
  activityService,
  attendanceService,
  childrenCentreService,
  type ActivityService,
  type AttendanceService,
  type ChildrenCentreService,
} from "@/services";
import { currentStaffId } from "@/api/middlewares/auth.middleware";

class ActivityController {
  constructor(
    private activityService: ActivityService,
    private attendanceService: AttendanceService,
    private childrenCentreService: ChildrenCentreService,
  ) {
    bindAll(this);
  }

  async create(req: Req<{ params: ChildrenCentreActivitiesParamsSchema, body: CreateActivitySchema }>, res: Response) {
    const { childrenCentreId } = req.params;
    const { childId, ...activity } = req.body;

    const attendance = await this.attendanceService.findOpenByChildId(childId, childrenCentreId);

    return this.activityService.create({
      ...activity,
      attendanceId: attendance.id,
      staffId: currentStaffId(res),
    }, childrenCentreId);
  }

  async find(req: Req<{ params: ChildrenCentreActivitiesParamsSchema, query: FindActivitiesSchema }>) {
    const { childrenCentreId } = req.params;

    await this.childrenCentreService.findOne(childrenCentreId);

    return this.activityService.find({ ...req.query, childrenCentreId });
  }

  async findOne(req: Req<{ params: ActivityParamsSchema }>) {
    return this.activityService.findOne(req.params.id, req.params.childrenCentreId);
  }

  async update(req: Req<{ params: ActivityParamsSchema, body: UpdateActivitySchema }>) {
    return this.activityService.update(req.params.id, req.params.childrenCentreId, req.body);
  }
}

export const activityController = new ActivityController(activityService, attendanceService, childrenCentreService);
