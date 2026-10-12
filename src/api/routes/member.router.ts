import { Router } from "express";
import memberController from "../controllers/member.controller.ts";
import { handle } from "../../common/utils/index.ts";
import { authorizationCheck } from "../middlewares/auth.middleware/index.ts";

const router: Router = Router();

router.post("/", handle(memberController.create, 201));

export default router;
