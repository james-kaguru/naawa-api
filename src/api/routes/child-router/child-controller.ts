import type { AddChildParentSchema, ChildParamsSchema, CreateChildSchema, FindChildrenSchema, UpdateChildSchema } from "./child.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import { childService, parentService, type ChildService, type ParentService } from "@/services";

class ChildController {
  constructor(private childService: ChildService, private parentService: ParentService) {
    bindAll(this);
  }

  async create(req: Req<{ body: CreateChildSchema }>) {
    await this.parentService.findOne(req.body.parentId);

    return this.childService.create(req.body);
  }

  async find(req: Req<{ query: FindChildrenSchema }>) {
    return this.childService.find(req.query);
  }

  async findOne(req: Req<{ params: ChildParamsSchema }>) {
    return this.childService.findOne(req.params.id);
  }

  async update(req: Req<{ params: ChildParamsSchema, body: UpdateChildSchema }>) {
    return this.childService.update(req.params.id, req.body);
  }

  async addParent(req: Req<{ params: ChildParamsSchema, body: AddChildParentSchema }>) {
    await Promise.all([
      this.childService.findOne(req.params.id),
      this.parentService.findOne(req.body.parentId),
    ]);

    await this.childService.addParent(req.params.id, req.body.parentId);

    return this.childService.findOne(req.params.id);
  }
}

export const childController = new ChildController(childService, parentService);
