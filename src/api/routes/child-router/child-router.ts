import { Router } from "express";
import { childController } from "./child-controller";
import { handle } from "@/common/utils/index";
import { validate } from "@/api/middlewares/validate.middleware";
import { addChildParentSchema, childParamsSchema, createChildSchema, findChildrenSchema, updateChildSchema } from "./child.request";

const childRouter: Router = Router();

childRouter.get("/", validate({ query: findChildrenSchema }), handle(childController.find));
childRouter.get("/:id", validate({ params: childParamsSchema }), handle(childController.findOne));
childRouter.post("/", validate({ body: createChildSchema }), handle(childController.create, 201));
childRouter.put("/:id", validate({ params: childParamsSchema, body: updateChildSchema }), handle(childController.update));
childRouter.post("/:id/parents", validate({ params: childParamsSchema, body: addChildParentSchema }), handle(childController.addParent, 201));

export { childRouter }
