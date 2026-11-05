import type { ChildrenCentreParamsSchema, CreateChildrenCentreSchema, FindChildrenCentresSchema, UpdateChildrenCentreSchema } from "./children-centre.request.ts";
import { bindAll } from "@/common/utils";
import type { Req } from "@/common/types";
import { childrenCentreService, type ChildrenCentreService } from "@/services";

class ChildrenCentreController {
  constructor(private childrenCentreService: ChildrenCentreService) {
    bindAll(this);
  }

  async create(req: Req<{ body: CreateChildrenCentreSchema }>) {
    return this.childrenCentreService.create(req.body);
  }

  async find(req: Req<{ query: FindChildrenCentresSchema }>) {
    return this.childrenCentreService.find(req.query);
  }

  async findOne(req: Req<{ params: ChildrenCentreParamsSchema }>) {
    return this.childrenCentreService.findOne(req.params.id);
  }

  async update(req: Req<{ params: ChildrenCentreParamsSchema, body: UpdateChildrenCentreSchema }>) {
    return this.childrenCentreService.update(req.params.id, req.body);
  }
}

export const childrenCentreController = new ChildrenCentreController(childrenCentreService);
