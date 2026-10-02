import { requireAuth, systemRoleCheck, validate } from "@/api/middlewares";
import { SystemRole } from "@/auth/plugins/admin";
import { handle } from "@/common/utils/index";
import { Router } from "express";
import { parentController } from "./parent-controller";
import { createParentSchema, findParentsSchema, updateParentSchema } from "./parent.request";

const parentRouter: Router = Router();

parentRouter.get("/",requireAuth, systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]),validate({ query: findParentsSchema }), handle(parentController.find));
parentRouter.get("/:id",requireAuth,systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]), handle(parentController.findOne));
parentRouter.post("/",requireAuth, systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]),validate({ body: createParentSchema }), handle(parentController.create, 201));
parentRouter.put("/:id",requireAuth, systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]) ,validate({ body: updateParentSchema }), handle(parentController.update));

export { parentRouter };
