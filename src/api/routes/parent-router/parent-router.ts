import { Router } from "express";
import { parentController } from "./parent-controller";
import { handle } from "@/common/utils/index";
import { requireAuth } from "@/api/middlewares/auth.middleware";
import { validate } from "@/api/middlewares/validate.middleware";
import { createParentSchema } from "./parent.request";

const parentRouter: Router = Router();

parentRouter.get("/", handle(parentController.find));
parentRouter.get("/:id", handle(parentController.findOne));
parentRouter.post("/", validate({ body: createParentSchema }), handle(parentController.create, 201));
parentRouter.put("/:id", requireAuth, handle(parentController.update));
parentRouter.delete("/:id", requireAuth, handle(parentController.delete));

export { parentRouter }
