import { Router } from "express";
import { activityController } from "./activity-controller";
import { handle } from "@/common/utils/index";
import { requireAuth } from "@/api/middlewares/auth.middleware";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  activityParamsSchema,
  childrenCentreActivitiesParamsSchema,
  createActivitySchema,
  findActivitiesSchema,
  updateActivitySchema,
} from "./activity.request";

const activityRouter: Router = Router({ mergeParams: true });

activityRouter.get(
  "/",
  validate({
    params: childrenCentreActivitiesParamsSchema,
    query: findActivitiesSchema,
  }),
  handle(activityController.find),
);
activityRouter.get(
  "/:id",
  validate({ params: activityParamsSchema }),
  handle(activityController.findOne),
);
activityRouter.post(
  "/",
  requireAuth,
  validate({
    params: childrenCentreActivitiesParamsSchema,
    body: createActivitySchema,
  }),
  handle(activityController.create, 201),
);
activityRouter.put(
  "/:id",
  requireAuth,
  validate({ params: activityParamsSchema, body: updateActivitySchema }),
  handle(activityController.update),
);

export { activityRouter };
