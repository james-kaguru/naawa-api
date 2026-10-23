import type {
  CreateMessageSchema,
  FindMessagesSchema,
  MessageParamsSchema,
} from "./message.request.ts";
import { bindAll } from "@/common/utils";
import type { Req, Res } from "@/common/types";
import {
  messageService,
  threadService,
  type MessageService,
  type ThreadService,
} from "@/services";
import type { Sender } from "@/db/schema";

class MessageController {
  constructor(
    private messageService: MessageService,
    private threadService: ThreadService,
  ) {
    bindAll(this);
  }

  async find(
    req: Req<{ params: MessageParamsSchema; query: FindMessagesSchema }>,
  ) {
    const { threadId, childrenCentreId } = req.params;

    await this.threadService.findOne(threadId, childrenCentreId);

    return this.messageService.find({ ...req.query, threadId });
  }

  async createMyMessage(
    req: Req<{ params: MessageParamsSchema; body: CreateMessageSchema }>,
    res: Res,
  ) {
    const { threadId, childrenCentreId } = req.params;

    await this.threadService.findOne(threadId, childrenCentreId);

    const staffId = res.locals.staffId ?? null;

    return this.messageService.create({
      threadId,
      sender: staffId ? "staff" : "parent",
      staffId,
      body: req.body.body,
    });
  }

  async markMyThreadMessagesAsRead(
    req: Req<{ params: MessageParamsSchema }>,
    res: Res,
  ) {
    const { threadId, childrenCentreId } = req.params;

    await this.threadService.findOne(threadId, childrenCentreId);

    const staffId = res.locals.staffId ?? null;
    const reader = res.locals.staffId ? "staff" : "parent";

    const count = await this.messageService.markAsRead(
      threadId,
      staffId,
      reader,
    );

    return { count };
  }
}

export const messageController = new MessageController(
  messageService,
  threadService,
);
