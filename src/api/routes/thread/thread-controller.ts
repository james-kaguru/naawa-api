import type {
  ChildrenCentreThreadParamsSchema,
  CreateThreadSchema,
  FindParentsThreadsSchema,
  FindThreadsSchema,
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
import {
  currentParentId,
  currentStaffId,
} from "@/api/middlewares/auth.middleware";
import { ORGANIZATION_ID } from "@/common/constants";

class ThreadController {
  constructor(
    private threadService: ThreadService,
    private messageService: MessageService,
  ) {
    bindAll(this);
  }

  async find(
    req: Req<{
      query: FindThreadsSchema;
      params: ChildrenCentreThreadParamsSchema;
    }>,
  ) {
    return this.threadService.find(req.params.childrenCentreId, {
      ...req.query,
      reader: "staff",
    });
  }

  async findOne(req: Req<{ params: ThreadParamsSchema }>) {
    return this.threadService.findOne(
      req.params.threadId,
      req.params.childrenCentreId,
    );
  }

  async createMyThread(
    req: Req<{ body: CreateThreadSchema; params: ThreadParamsSchema }>,
    res: Res,
  ) {
    const { body } = req.body;
    const { childrenCentreId } = req.params;

    const parentId =
      req.body.sender === "parent" ? currentParentId(res) : req.body.parentId;
    const thread = await this.threadService.findOrCreate({
      childrenCentreId,
      parentId,
    });

    if (req.body.sender === "parent") {
      await this.messageService.create({
        threadId: thread.id,
        sender: req.body.sender,
        staffId: null,
        body,
      });
    } else if (req.body.sender === "staff") {
      const staffId = currentStaffId(res);

      await this.messageService.create({
        threadId: thread.id,
        sender: req.body.sender,
        staffId,
        body,
      });
    }

    return thread;
  }

  async findParentThreads(
    req: Req<{
      query: FindParentsThreadsSchema;
      params: ChildrenCentreThreadParamsSchema;
    }>,
    res: Res,
  ) {
    return this.threadService.find(req.params.childrenCentreId, {
      ...req.query,
      parentId: currentParentId(res),
      reader: "parent",
    });
  }
}

export const threadController = new ThreadController(
  threadService,
  messageService,
);
