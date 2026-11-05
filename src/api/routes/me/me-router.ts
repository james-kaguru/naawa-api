import { Router } from "express";
import { handle } from "@/common/utils/index";
import { meController } from "./me-controller";
import { authorizationCheck } from "@/api/middlewares";

const meRouter: Router = Router();

meRouter.get(
  "/",
  authorizationCheck({
    permissions: {},
  }),
  handle(meController.findMe),
);

export { meRouter };
