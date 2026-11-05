import { Router } from "express";
import { threadController } from "./thread.controller";
import { handle } from "@/common/utils/index";
import { authorizationCheck } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  childrenCentreThreadParamsSchema,
  createThreadSchema,
  findParentsThreadsSchema,
  findThreadsSchema,
} from "./thread.request";

const threadRouter: Router = Router({ mergeParams: true });

threadRouter.get(
  "/",
  authorizationCheck({
    permissions: {
      thread: ["list"],
    },
  }),
  validate({ params: childrenCentreThreadParamsSchema, query: findThreadsSchema }),
  handle(threadController.find),
);

threadRouter.get(
  "/me",
  authorizationCheck({
    permissions: {
      thread: ["list:own"],
    },
  }),
  validate({
    params: childrenCentreThreadParamsSchema,
    query: findParentsThreadsSchema,
  }),
  handle(threadController.findParentThreads),
);

threadRouter.post(
  "/",
  authorizationCheck({
    permissions: {
      thread: ["create"],
    },
  }),
  validate({
    params: childrenCentreThreadParamsSchema,
    body: createThreadSchema,
  }),
  handle(threadController.createMyThread, 201),
);

export { threadRouter };
