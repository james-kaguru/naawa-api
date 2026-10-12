import type {
  CreateThreadSchema,
  FindMyThreadsSchema,
  FindThreadsSchema,
  ThreadParamsSchema,
} from "../thread.request.ts";
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

  async find(req: Req<{ query: FindThreadsSchema }>) {
    return this.threadService.find(req.query);
  }

  async findOne(req: Req<{ params: ThreadParamsSchema }>) {
    return this.threadService.findOne(req.params.id);
  }

  async createMyThread(req: Req<{ body: CreateThreadSchema }>, res: Res) {
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

  async findMyThreads(req: Req<{ query: FindMyThreadsSchema }>, res: Res) {
    return this.threadService.find({ ...req.query, memberId: currentMemberId(res) });
  }

  async findMyThread(req: Req<{ params: ThreadParamsSchema }>, res: Res) {
    return this.threadService.findOne(req.params.id, currentMemberId(res));
  }
}

export const threadController = new ThreadController(threadService, memberService, messageService);
