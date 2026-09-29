import { Router } from "express";
import { parentRouter } from "./parent-router";
import { childRouter } from "./child-router";
import { childrenCentreRouter } from "./children-centre-router";
import { enrollmentRouter } from "./enrollment-router";
import memberRouter from "./member.router.ts";

const router: Router = Router();

router.use("/parents", parentRouter);
router.use("/children", childRouter);
router.use("/children-centres", childrenCentreRouter);
router.use("/children-centres/:childrenCentreId/enrollments", enrollmentRouter);
router.use("/members", memberRouter);

export default router;
