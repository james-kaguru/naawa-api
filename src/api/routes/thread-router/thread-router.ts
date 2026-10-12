import { Router } from "express";
import { messageController, threadController } from "./controllers";
import { handle } from "@/common/utils/index";
import { requireAuth, authorizationCheck } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  createMessageSchema,
  createThreadSchema,
  findMessagesSchema,
  findMyThreadsSchema,
  findThreadsSchema,
  threadMessagesParamsSchema,
  threadParamsSchema,
} from "./thread.request";

const threadRouter: Router = Router();

threadRouter.get(
  "/me",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["list:own"],
    },
  }),
  validate({ query: findMyThreadsSchema }),
  handle(threadController.findMyThreads),
);
threadRouter.post(
  "/me",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["create:own"],
    },
  }),
  validate({ body: createThreadSchema }),
  handle(threadController.createMyThread, 201),
);
threadRouter.get(
  "/me/:id",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["list:own"],
    },
  }),
  validate({ params: threadParamsSchema }),
  handle(threadController.findMyThread),
);
threadRouter.get(
  "/me/:threadId/messages",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["list:own"],
    },
  }),
  validate({ params: threadMessagesParamsSchema, query: findMessagesSchema }),
  handle(messageController.findMyThreadMessages),
);
threadRouter.post(
  "/me/:threadId/messages",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["create:own"],
    },
  }),
  validate({ params: threadMessagesParamsSchema, body: createMessageSchema }),
  handle(messageController.createMyThreadMessage, 201),
);
threadRouter.put(
  "/me/:threadId/messages/read",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["update:own"],
    },
  }),
  validate({ params: threadMessagesParamsSchema }),
  handle(messageController.markMyThreadMessagesAsRead),
);

threadRouter.get(
  "/",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["list"],
    },
  }),
  validate({ query: findThreadsSchema }),
  handle(threadController.find),
);
threadRouter.get(
  "/:id",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["list"],
    },
  }),
  validate({ params: threadParamsSchema }),
  handle(threadController.findOne),
);
threadRouter.get(
  "/:threadId/messages",
  requireAuth,
  authorizationCheck({
    permissions: {
      message: ["list"],
    },
  }),
  validate({ params: threadMessagesParamsSchema, query: findMessagesSchema }),
  handle(messageController.find),
);

export { threadRouter };
