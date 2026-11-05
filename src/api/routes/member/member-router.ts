import { Router } from "express";
import { handle } from "@/common/utils/index";
import { memberController } from "./member-controller";

const memberRouter: Router = Router();

memberRouter.post("/", handle(memberController.create, 201));

export { memberRouter };
