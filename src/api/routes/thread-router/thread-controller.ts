import type {
  CreateMessageSchema,
  CreateThreadSchema,
  FindMessagesSchema,
  FindThreadsSchema,
  ThreadMessagesParamsSchema,
  ThreadParamsSchema,
} from "./thread.request.ts";
import { bindAll } from "@/common/utils";
import type { Req, Res } from "@/common/types";
import {
  memberService,
  messageService,
  threadService,
  type MemberService,
  type MessageService,
  type ThreadService,
} from "@/services";
import { currentMemberId } from "@/api/middlewares/auth.middleware";
import { ORGANIZATION_ID } from "@/common/constants";

class ThreadController {
  constructor(
    private threadService: ThreadService,
    private memberService: MemberService,
    private messageService: MessageService,
  ) {
    bindAll(this);
  }

  async create(req: Req<{ body: CreateThreadSchema }>, res: Res) {
    const { memberId, body } = req.body;
    const senderId = currentMemberId(res);

    await this.memberService.findOne(memberId, ORGANIZATION_ID);

    const thread = await this.threadService.findOrCreate({
      memberIdOne: senderId,
      memberIdTwo: memberId,
    });

    await this.messageService.create({
      threadId: thread.id,
      senderId,
      body,
    });

    return thread;
  }

  async find(req: Req<{ query: FindThreadsSchema }>, res: Res) {
    return this.threadService.find({ ...req.query, memberId: currentMemberId(res) });
  }

  async findOne(req: Req<{ params: ThreadParamsSchema }>, res: Res) {
    return this.threadService.findOne(req.params.id, currentMemberId(res));
  }

  async createMessage(req: Req<{ params: ThreadMessagesParamsSchema, body: CreateMessageSchema }>, res: Res) {
    const { threadId } = req.params;
    const memberId = currentMemberId(res);

    await this.threadService.findOne(threadId, memberId);

    return this.messageService.create({
      threadId,
      senderId: memberId,
      body: req.body.body,
    });
  }

  async findMessages(req: Req<{ params: ThreadMessagesParamsSchema, query: FindMessagesSchema }>, res: Res) {
    const { threadId } = req.params;

    await this.threadService.findOne(threadId, currentMemberId(res));

    return this.messageService.find({ ...req.query, threadId });
  }

  async markMessagesAsRead(req: Req<{ params: ThreadMessagesParamsSchema }>, res: Res) {
    const { threadId } = req.params;
    const memberId = currentMemberId(res);

    await this.threadService.findOne(threadId, memberId);

    const count = await this.messageService.markAsRead(threadId, memberId);

    return { count };
  }
}

export const threadController = new ThreadController(threadService, memberService, messageService);
