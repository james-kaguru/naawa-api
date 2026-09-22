import { Router } from "express";
import parentController from "../controllers/parent.controller.ts";
import { handle } from "../../common/utils/index.ts";
import { requireAuth } from "@/api/middlewares/auth.middleware";
import { validate } from "@/api/middlewares/validate.middleware";
import { createParentSchema } from "../middlewares/validators/parent.validators.ts";

const router: Router = Router();

router.get("/", handle(parentController.find));
router.get("/:id", handle(parentController.findOne));
router.post("/", validate({ body: createParentSchema }), handle(parentController.create, 201));
router.put("/:id", requireAuth, handle(parentController.update));
router.delete("/:id", requireAuth, handle(parentController.delete));

export default router;
