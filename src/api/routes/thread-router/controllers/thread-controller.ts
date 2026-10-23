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
import {
  currentMemberId,
  currentParentId,
  currentStaffId,
} from "@/api/middlewares/auth.middleware";
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
    return this.threadService.findOne(req.params.threadId);
  }

  async createMyThread(
    req: Req<{ body: CreateThreadSchema; params: ThreadParamsSchema }>,
    res: Res,
  ) {
    const { parentId, body } = req.body;
    const { childrenCentreId } = req.params;

    const thread = await this.threadService.findOrCreate({
      childrenCentreId,
      parentId,
    });

    if (req.body.sender === "parent") {
      const parentId = currentParentId(res);
      
      await this.messageService.create({
        threadId: thread.id,
        sender: req.body.sender,
        parentId,
        staffId: null,
        body,
      });
    } else if (req.body.sender === "staff") {
      const staffId = currentStaffId(res);

      await this.messageService.create({
        threadId: thread.id,
        sender: req.body.sender,
        parentId,
        staffId,
        body,
      });
    }

    return thread;
  }

  async findMyThreads(req: Req<{ query: FindMyThreadsSchema }>, res: Res) {
    return this.threadService.find({
      ...req.query,
      memberId: currentMemberId(res),
    });
  }

  async findMyThread(req: Req<{ params: ThreadParamsSchema }>, res: Res) {
    return this.threadService.findOne(
      req.params.threadId,
      currentMemberId(res),
    );
  }
}

export const threadController = new ThreadController(
  threadService,
  memberService,
  messageService,
);
