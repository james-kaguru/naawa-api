import { Router } from "express";
import { activityController } from "./activity-controller";
import { handle } from "@/common/utils/index";
import { requireAuth, authorizationCheck } from "@/api/middlewares";
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
  requireAuth,
  authorizationCheck({
    permissions: {
      activity: ["list"],
    },
  }),
  validate({
    params: childrenCentreActivitiesParamsSchema,
    query: findActivitiesSchema,
  }),
  handle(activityController.find),
);
activityRouter.get(
  "/:id",
  requireAuth,
  authorizationCheck({
    permissions: {
      activity: ["list"],
    },
  }),
  validate({ params: activityParamsSchema }),
  handle(activityController.findOne),
);
activityRouter.post(
  "/",
  requireAuth,
  authorizationCheck({
    permissions: {
      activity: ["create"],
    },
  }),
  validate({
    params: childrenCentreActivitiesParamsSchema,
    body: createActivitySchema,
  }),
  handle(activityController.create, 201),
);
activityRouter.put(
  "/:id",
  requireAuth,
  authorizationCheck({
    permissions: {
      activity: ["update"],
    },
  }),
  validate({ params: activityParamsSchema, body: updateActivitySchema }),
  handle(activityController.update),
);

export { activityRouter };
