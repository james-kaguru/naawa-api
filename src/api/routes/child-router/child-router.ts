import { Router } from "express";
import { childController } from "./child-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import { addChildParentSchema, childParamsSchema, createChildSchema, findChildrenSchema, updateChildSchema } from "./child.request";
import { requireAuth, systemRoleCheck } from "@/api/middlewares";
import { SystemRole } from "@/auth/plugins/admin";

const childRouter: Router = Router();

childRouter.get("/", requireAuth,systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]),validate({ query: findChildrenSchema }), handle(childController.find));
childRouter.get("/:id", requireAuth,systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]),validate({ params: childParamsSchema }), handle(childController.findOne));
childRouter.post("/",requireAuth, systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]),validate({ body: createChildSchema }), handle(childController.create, 201));
childRouter.put("/:id", requireAuth,systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]),validate({ params: childParamsSchema, body: updateChildSchema }), handle(childController.update));
childRouter.post("/:id/parents",requireAuth, systemRoleCheck([SystemRole.Admin,SystemRole.SystemAdmin]),validate({ params: childParamsSchema, body: addChildParentSchema }), handle(childController.addParent, 201));

export { childRouter }
