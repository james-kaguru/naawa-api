import { Router } from "express";
import { messageController } from "./message-controller";
import { handle } from "@/common/utils/index";
import { requireAuth } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  createMessageSchema,
  findMessagesSchema,
  threadMessagesParamsSchema,
} from "./message.request";

const messageRouter: Router = Router({ mergeParams: true });

messageRouter.get(
  "/",
  requireAuth,
  validate({ params: threadMessagesParamsSchema, query: findMessagesSchema }),
  handle(messageController.find),
);
messageRouter.post(
  "/",
  requireAuth,
  validate({ params: threadMessagesParamsSchema, body: createMessageSchema }),
  handle(messageController.create, 201),
);
messageRouter.put(
  "/read",
  requireAuth,
  validate({ params: threadMessagesParamsSchema }),
  handle(messageController.markAsRead),
);

export { messageRouter };
