import { Router } from "express";
import { messageController, threadController } from "./controllers";
import { handle } from "@/common/utils/index";
import {
  requireAuth,
  authorizationCheck,
  currentMemberId,
} from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  createMessageSchema,
  createThreadSchema,
  findMessagesSchema,
  findMyThreadsSchema,
  findThreadsSchema,
  threadParamsSchema,
} from "./thread.request";
import type { Req, Res } from "@/common/types";
import { InternalServerError } from "@/common/errors";
import { threadService } from "@/services";

const threadRouter: Router = Router();

async function threadParticipantCheck(
  req: Req<{ params: { threadId: string } }>,
  res: Res,
): Promise<void> {
  const memberId = currentMemberId(res);

  const threadId = req.params.threadId;

  if (threadId === undefined)
    throw new InternalServerError(
      `route ${req.url} doesnt have threadId param`,
    );

  await threadService.findOne(threadId, memberId);
}

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
  "/me/:threadId",
  requireAuth,
  authorizationCheck(
    {
      permissions: {
        message: ["list:own"],
      },
    },
    threadParticipantCheck,
  ),
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
  validate({ params: threadParamsSchema, query: findMessagesSchema }),
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
  validate({ params: threadParamsSchema, body: createMessageSchema }),
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
  validate({ params: threadParamsSchema }),
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
  "/:threadId",
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
  validate({ params: threadParamsSchema, query: findMessagesSchema }),
  handle(messageController.find),
);

export { threadRouter };
