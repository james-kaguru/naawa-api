import type { Request } from "express";
import type { CreateParentSchema, FindParentsSchema } from "./parent.request.ts";
import { bindAll } from "@/common/utils";
import { currentUser } from "../../middlewares/auth.middleware.ts";
import type { Req } from "@/common/types";

class ParentController {
  constructor() {
    bindAll(this);
  }

  find(req: Req<{ query: FindParentsSchema }>) {
    console.log(req.query)
    return "find";
  }

  findOne(req: Request<unknown, unknown, CreateParentSchema>) {
    throw new Error("not implemented");

    return "findone";
  }

  create() {
    return "create";
  }

  update() {
    return "update";
  }

  delete() {
    return "delete";
  }
}

export const parentController = new ParentController();
