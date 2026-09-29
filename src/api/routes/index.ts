import { Router } from "express";
import { parentRouter } from "./parent-router";
import { childRouter } from "./child-router";
import memberRouter from "./member.router.ts";

const router: Router = Router();

router.use("/parents", parentRouter);
router.use("/children", childRouter);
router.use("/members", memberRouter);

export default router;
