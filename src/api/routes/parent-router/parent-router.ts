import { Router } from "express";
import { parentController } from "./parent-controller";
import { handle } from "@/common/utils/index";
import { requireAuth } from "@/api/middlewares/auth.middleware";
import { validate } from "@/api/middlewares/validate.middleware";
import { createParentSchema, findParentsSchema, updateParentSchema } from "./parent.request";

const parentRouter: Router = Router();

parentRouter.get("/", validate({ query: findParentsSchema }), handle(parentController.find));
parentRouter.get("/:id", handle(parentController.findOne));
parentRouter.post("/", validate({ body: createParentSchema }), handle(parentController.create, 201));
parentRouter.put("/:id", validate({ body: updateParentSchema }), handle(parentController.update));

export { parentRouter }
