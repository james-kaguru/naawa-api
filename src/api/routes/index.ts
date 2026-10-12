import { Router } from "express";
import { parentRouter } from "./parent-router";
import { childRouter } from "./child-router";
import { childrenCentreRouter } from "./children-centre-router";
import { enrollmentRouter } from "./enrollment-router";
import { staffRouter } from "./staff-router";
import { attendanceRouter } from "./attendance-router";
import { activityRouter } from "./activity-router";
import { threadRouter } from "./thread-router";
import { messageRouter } from "./message-router";
import memberRouter from "./member.router.ts";

const router: Router = Router();

router.use("/parents", parentRouter);
router.use("/children", childRouter);
router.use("/children-centres", childrenCentreRouter);
router.use("/children-centres/:childrenCentreId/enrollments", enrollmentRouter);
router.use("/children-centres/:childrenCentreId/staff", staffRouter);
router.use("/children-centres/:childrenCentreId/attendances", attendanceRouter);
router.use("/children-centres/:childrenCentreId/activities", activityRouter);
router.use("/threads", threadRouter);
router.use("/threads/:threadId/messages", messageRouter);
router.use("/members", memberRouter);

export default router;
