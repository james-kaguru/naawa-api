import { Router } from "express";
import { parentRouter } from "./parent";
import { childRouter } from "./child";
import { childrenCentreRouter } from "./children-centre";
import { enrollmentRouter } from "./enrollment";
import { staffRouter } from "./staff";
import { attendanceRouter } from "./attendance";
import { activityRouter } from "./activity";
import { threadRouter } from "./thread";
import { messageRouter } from "./message";
import { invoiceRouter } from "./invoice";
import { billingRunRouter } from "./billing-run";
import { memberRouter } from "./member";
import { meRouter } from "./me";

const router: Router = Router();

router.use("/parents", parentRouter);
router.use("/children", childRouter);
router.use("/children-centres", childrenCentreRouter);
router.use("/children-centres/:childrenCentreId/enrollments", enrollmentRouter);
router.use("/children-centres/:childrenCentreId/staff", staffRouter);
router.use("/children-centres/:childrenCentreId/attendances", attendanceRouter);
router.use("/children-centres/:childrenCentreId/activities", activityRouter);
router.use("/children-centres/:childrenCentreId/threads", threadRouter);
router.use(
  "/children-centres/:childrenCentreId/threads/:threadId/messages",
  messageRouter,
);
router.use("/children-centres/:childrenCentreId/invoices", invoiceRouter);
router.use("/children-centres/:childrenCentreId/billing-runs", billingRunRouter);
router.use("/members", memberRouter);
router.use("/me", meRouter);

export default router;
