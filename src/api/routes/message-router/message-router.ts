import { Router } from "express";
import { messageController } from "./message-controller";
import { handle } from "@/common/utils/index";
import { authorizationCheck } from "@/api/middlewares";
import { validate } from "@/api/middlewares/validate.middleware";
import {
  createMessageSchema,
  findMessagesSchema,
  messageParamsSchema,
} from "./message.request";

const messageRouter: Router = Router({ mergeParams: true });

messageRouter.get(
  "/",
  authorizationCheck({
    permissions: {
      message: ["list"],
    },
  }),
  validate({ params: messageParamsSchema, query: findMessagesSchema }),
  handle(messageController.find),
);

messageRouter.post(
  "/",
  authorizationCheck({
    permissions: {
      message: ["create:own"],
    },
  }),
  validate({ params: messageParamsSchema, body: createMessageSchema }),
  handle(messageController.createMyThreadMessage, 201),
);

messageRouter.put(
  "/read",
  authorizationCheck({
    permissions: {
      message: ["update:own"],
    },
  }),
  validate({ params: messageParamsSchema }),
  handle(messageController.markMyThreadMessagesAsRead),
);

export { messageRouter };
