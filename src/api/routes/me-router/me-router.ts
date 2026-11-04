import { Router } from "express";
import { handle } from "@/common/utils/index";
import { meController } from "./me-controller";

const meRouter: Router = Router();

meRouter.get("/permissions", handle(meController.permissions));

export { meRouter };
