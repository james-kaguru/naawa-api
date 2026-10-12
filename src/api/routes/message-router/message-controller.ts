import type { CreateMessageSchema, FindMessagesSchema, ThreadMessagesParamsSchema } from "./message.request.ts";
import { bindAll } from "@/common/utils";
import type { Req, Res } from "@/common/types";
import {
  messageService,
  threadService,
  type MessageService,
  type ThreadService,
} from "@/services";
import { currentMemberId } from "@/api/middlewares/auth.middleware";

class MessageController {
  constructor(
    private messageService: MessageService,
    private threadService: ThreadService,
  ) {
    bindAll(this);
  }

  async create(req: Req<{ params: ThreadMessagesParamsSchema, body: CreateMessageSchema }>, res: Res) {
    const { threadId } = req.params;
    const memberId = currentMemberId(res);

    await this.threadService.findOne(threadId, memberId);

    return this.messageService.create({
      threadId,
      senderId: memberId,
      body: req.body.body,
    });
  }

  async find(req: Req<{ params: ThreadMessagesParamsSchema, query: FindMessagesSchema }>, res: Res) {
    const { threadId } = req.params;

    await this.threadService.findOne(threadId, currentMemberId(res));

    return this.messageService.find({ ...req.query, threadId });
  }

  async markAsRead(req: Req<{ params: ThreadMessagesParamsSchema }>, res: Res) {
    const { threadId } = req.params;
    const memberId = currentMemberId(res);

    await this.threadService.findOne(threadId, memberId);

    const count = await this.messageService.markAsRead(threadId, memberId);

    return { count };
  }
}

export const messageController = new MessageController(messageService, threadService);
