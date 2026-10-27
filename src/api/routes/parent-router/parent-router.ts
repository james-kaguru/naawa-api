import { authorizationCheck, validate } from "@/api/middlewares";
import { UserRoles } from "@/auth/plugins/admin";
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
  authorizationCheck({
    permissions: {
      child: ["list:own"],
    },
  }),
  handle(parentController.findMyChildren),
);
parentRouter.post(
  "/me/children",
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
  authorizationCheck({
    permissions: {
      parent: ["list"],
    },
  }),
  handle(parentController.findOne),
);
parentRouter.post(
  "/",
  authorizationCheck({
    systemRoles: [UserRoles.admin, UserRoles.staff, UserRoles.systemAdmin],
    permissions: {
      parent: ["update"],
    },
  }),
  validate({ body: createParentSchema }),
  handle(parentController.create, 201),
);
parentRouter.put(
  "/:id",
  authorizationCheck({
    systemRoles: [UserRoles.admin, UserRoles.staff, UserRoles.systemAdmin],
    permissions: {
      parent: ["create"],
    },
  }),
  validate({ body: updateParentSchema }),
  handle(parentController.update),
);

export { parentRouter };
