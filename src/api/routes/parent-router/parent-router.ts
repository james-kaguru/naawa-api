import { requireAuth, authorizationCheck, validate } from "@/api/middlewares";
import { SystemRole } from "@/auth/plugins/admin";
import { handle } from "@/common/utils/index";
import { Router } from "express";
import { parentController } from "./parent-controller";
import {
  createMyChildSchema,
  createParentSchema,
  findParentsSchema,
  parentChildrenParamsSchema,
  updateMyChildSchema,
  updateParentSchema,
} from "./parent.request";
import { findChildAttendancesSchema } from "../attendance-router/attendance.request";
import { findChildActivitiesSchema } from "../activity-router/activity.request";

const parentRouter: Router = Router();

parentRouter.get(
  "/me/children",
  requireAuth,
  authorizationCheck({
    permissions: {
      child: ["list:own"],
    },
  }),
  handle(parentController.findMyChildren),
);
parentRouter.post(
  "/me/children",
  requireAuth,
  authorizationCheck({
    permissions: {
      child: ["create:own"],
    },
  }),
  validate({ body: createMyChildSchema }),
  handle(parentController.createMyChild, 201),
);
parentRouter.put(
  "/me/children/:childId",
  requireAuth,
  authorizationCheck({
    permissions: {
      child: ["update:own"],
    },
  }),
  validate({ params: parentChildrenParamsSchema, body: updateMyChildSchema }),
  handle(parentController.updateMyChild),
);
parentRouter.get(
  "/me/children/:childId/enrollments",
  requireAuth,
  authorizationCheck({
    permissions: {
      enrollment: ["list:own"],
    },
  }),
  validate({ params: parentChildrenParamsSchema }),
  handle(parentController.findMyChildEnrollments),
);
parentRouter.get(
  "/me/children/:childId/attendances",
  requireAuth,
  authorizationCheck({
    permissions: {
      attendance: ["list:own"],
    },
  }),
  validate({
    params: parentChildrenParamsSchema,
    query: findChildAttendancesSchema,
  }),
  handle(parentController.findMyChildAttendances),
);
parentRouter.get(
  "/me/children/:childId/activities",
  requireAuth,
  authorizationCheck({
    permissions: {
      activity: ["list:own"],
    },
  }),
  validate({
    params: parentChildrenParamsSchema,
    query: findChildActivitiesSchema,
  }),
  handle(parentController.findMyChildActivities),
);

parentRouter.get(
  "/",
  requireAuth,
  authorizationCheck({
    permissions: {
      parent: ["list"],
    },
  }),
  validate({ query: findParentsSchema }),
  handle(parentController.find),
);
parentRouter.get(
  "/:id",
  requireAuth,
  authorizationCheck({
    permissions: {
      parent: ["list"],
    },
  }),
  handle(parentController.findOne),
);
parentRouter.post(
  "/",
  requireAuth,
  authorizationCheck({
    systemRoles: [SystemRole.Admin, SystemRole.SystemAdmin],
    permissions: {
      parent: ["update"],
    },
  }),
  validate({ body: createParentSchema }),
  handle(parentController.create, 201),
);
parentRouter.put(
  "/:id",
  requireAuth,
  authorizationCheck({
    systemRoles: [SystemRole.Admin, SystemRole.SystemAdmin],
    permissions: {
      parent: ["create"],
    },
  }),
  validate({ body: updateParentSchema }),
  handle(parentController.update),
);

export { parentRouter };
