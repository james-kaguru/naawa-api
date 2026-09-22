import type { Request } from "express";
import type { CreateParentSchema, FindParentsSchema } from "./parent.request.ts";
import { bindAll } from "@/common/utils";
import { currentUser } from "../../middlewares/auth.middleware.ts";
import type { Req } from "@/common/types";
import { parentService, type ParentService } from "@/services";

class ParentController {
  constructor(private parentService: ParentService) {
    bindAll(this);
  }

  async create(req: Req<{ body: CreateParentSchema }>) {
    const body = req.body;
    try {
      const parent = await this.parentService.findByMemberId(body.memberId);
      return parent;
    } catch (e) {
      return this.parentService.create(body)
    }
  }

  async find(req: Req<{ query: FindParentsSchema }>) {

    return "find";
  }

  async findOne(req: Request<unknown, unknown, CreateParentSchema>) {
    throw new Error("not implemented");

    return "findone";
  }

  async update() {
    return "update";
  }

  async delete() {
    return "delete";
  }
}

export const parentController = new ParentController(parentService);
