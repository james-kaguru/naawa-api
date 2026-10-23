import { Router } from "express";
import { messageController, threadController } from "./controllers";
import { handle } from "@/common/utils/index";
import { authorizationCheck, currentMemberId } from "@/api/middlewares";
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

// thread participant routes
// threadRouter.get(
//   "/me",
//   authorizationCheck({
//     permissions: {
//       message: ["list:own"],
//     },
//   }),
//   validate({ query: findMyThreadsSchema }),
//   handle(threadController.findMyThreads),
// );
threadRouter.post(
  "/",
  authorizationCheck({
    permissions: {
      message: ["create:own"],
    },
  }),
  validate({ body: createThreadSchema, params: threadParamsSchema }),
  handle(threadController.createMyThread, 201),
);
// threadRouter.get(
//   "/me/:threadId",
//   authorizationCheck(
//     {
//       permissions: {
//         message: ["list:own"],
//       },
//     },
//     threadParticipantCheck,
//   ),
//   validate({ params: threadParamsSchema }),
//   handle(threadController.findMyThread),
// );
// threadRouter.get(
//   "/me/:threadId/messages",
//   authorizationCheck(
//     {
//       permissions: {
//         message: ["list:own"],
//       },
//     },
//     threadParticipantCheck,
//   ),
//   validate({ params: threadParamsSchema, query: findMessagesSchema }),
//   handle(messageController.findMyThreadMessages),
// );
// threadRouter.post(
//   "/me/:threadId/messages",
//   authorizationCheck(
//     {
//       permissions: {
//         message: ["create:own"],
//       },
//     },
//     threadParticipantCheck,
//   ),
//   validate({ params: threadParamsSchema, body: createMessageSchema }),
//   handle(messageController.createMyThreadMessage, 201),
// );
// threadRouter.put(
//   "/me/:threadId/messages/read",
//   authorizationCheck(
//     {
//       permissions: {
//         message: ["update:own"],
//       },
//     },
//     threadParticipantCheck,
//   ),
//   validate({ params: threadParamsSchema }),
//   handle(messageController.markMyThreadMessagesAsRead),
// );

// // owner routes
// threadRouter.get(
//   "/",
//   authorizationCheck({
//     permissions: {
//       message: ["list"],
//     },
//   }),
//   validate({ query: findThreadsSchema }),
//   handle(threadController.find),
// );
// threadRouter.get(
//   "/:threadId",
//   authorizationCheck({
//     permissions: {
//       message: ["list"],
//     },
//   }),
//   validate({ params: threadParamsSchema }),
//   handle(threadController.findOne),
// );
// threadRouter.get(
//   "/:threadId/messages",
//   authorizationCheck({
//     permissions: {
//       message: ["list"],
//     },
//   }),
//   validate({ params: threadParamsSchema, query: findMessagesSchema }),
//   handle(messageController.find),
// );

export { threadRouter };
function threadParticipantCheck(req: Req, res: Res): Promise<void> {
  throw new Error("Function not implemented.");
}
