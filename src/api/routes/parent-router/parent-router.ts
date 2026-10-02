import { Router, type NextFunction } from "express";
import { parentController } from "./parent-controller";
import { handle } from "@/common/utils/index";
import { currentUser, requireAuth } from "@/api/middlewares/auth.middleware";
import { validate } from "@/api/middlewares/validate.middleware";
import { createParentSchema, findParentsSchema, updateParentSchema } from "./parent.request";
import type { Req, Res } from "@/common/types";
import { ForbiddenError, InternalServerError } from "@/common/errors";
import { SystemRole } from "@/auth/plugins/admin";

const parentRouter: Router = Router();

const permissionCheck = async (req: Req, res: Res, next: NextFunction) => {
  const user = currentUser(res)
  const userRole = user.role;

  if (!userRole) throw new InternalServerError(`Role not set for user ${user.id}`)

  if (user.role !== SystemRole.SuperAdmin && user.role !== SystemRole.Admin)
   throw new ForbiddenError('Forbidden')

  next()
}
parentRouter.get("/", validate({ query: findParentsSchema }), handle(parentController.find));
parentRouter.get("/:id", handle(parentController.findOne));
parentRouter.post("/", validate({ body: createParentSchema }), handle(parentController.create, 201));
parentRouter.put("/:id",requireAuth,permissionCheck ,validate({ body: updateParentSchema }), handle(parentController.update));

export { parentRouter }
