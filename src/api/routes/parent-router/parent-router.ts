import { Router, type NextFunction } from "express";
import { parentController } from "./parent-controller";
import { handle } from "@/common/utils/index";
import { currentUser, requireAuth, systemRoleCheck,validate } from "@/api/middlewares";
import { createParentSchema, findParentsSchema, updateParentSchema } from "./parent.request";
import type { Req, Res } from "@/common/types";
import { ForbiddenError, InternalServerError } from "@/common/errors";
import { SystemRole } from "@/auth/plugins/admin";

const parentRouter: Router = Router();


parentRouter.get("/", validate({ query: findParentsSchema }), handle(parentController.find));
parentRouter.get("/:id", handle(parentController.findOne));
parentRouter.post("/", validate({ body: createParentSchema }), handle(parentController.create, 201));
parentRouter.put("/:id",requireAuth,systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]) ,validate({ body: updateParentSchema }), handle(parentController.update));

export { parentRouter }
