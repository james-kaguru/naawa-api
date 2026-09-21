import { Router } from "express";
import memberController from "../controllers/member.controller.ts";
import { handle } from "../../common/utils/index.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const router: Router = Router();

router.post("/", requireAuth, handle(memberController.create, 201));

export default router;
