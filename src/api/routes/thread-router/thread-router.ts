import { Router } from "express";
import { threadController } from "./thread-controller";
import { handle } from "@/common/utils/index";
import { requireAuth } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  createThreadSchema,
  findThreadsSchema,
  threadParamsSchema,
} from "./thread.request";

const threadRouter: Router = Router();

threadRouter.get(
  "/",
  requireAuth,
  validate({ query: findThreadsSchema }),
  handle(threadController.find),
);
threadRouter.get(
  "/:id",
  requireAuth,
  validate({ params: threadParamsSchema }),
  handle(threadController.findOne),
);
threadRouter.post(
  "/",
  requireAuth,
  validate({ body: createThreadSchema }),
  handle(threadController.create, 201),
);

export { threadRouter };
