import { Router } from "express";
import parentRouter from "./parent.router.ts";

const router: Router = Router();

router.use("/parents", parentRouter);

export default router;
