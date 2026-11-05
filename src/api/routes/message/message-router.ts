import { Router, type NextFunction } from "express";
import { messageController } from "./message-controller";
import { handle } from "@/common/utils/index";
import { authorizationCheck } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  createMessageSchema,
  findMessagesSchema,
  messageParamsSchema,
} from "./message.request";
import type { Req, Res } from "@/common/types";

const messageRouter: Router = Router({ mergeParams: true });

async function threadAuth(req: Req, res: Res) {}

messageRouter.get(
  "/",
  authorizationCheck(
    {
      permissions: {
        message: ["list"],
      },
    },
    threadAuth,
  ),
  validate({ params: messageParamsSchema, query: findMessagesSchema }),
  handle(messageController.find),
);

messageRouter.post(
  "/",
  authorizationCheck(
    {
      permissions: {
        message: ["create:own"],
      },
    },
    threadAuth,
  ),
  validate({ params: messageParamsSchema, body: createMessageSchema }),
  handle(messageController.createMyMessage, 201),
);

messageRouter.put(
  "/read",
  authorizationCheck(
    {
      permissions: {
        message: ["update:own"],
      },
    },
    threadAuth,
  ),
  validate({ params: messageParamsSchema }),
  handle(messageController.markMyThreadMessagesAsRead),
);

export { messageRouter };
