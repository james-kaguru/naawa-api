import type { Request } from "express";
import type { CreateParentSchema } from "../../middlewares/validators/parent.validators.ts";
import { bindAll } from "../../../common/utils/index.ts";
import { currentUser } from "../../middlewares/auth.middleware.ts";

class ParentController {
  constructor() {
    bindAll(this);
  }

  find(req: Request<unknown, unknown, CreateParentSchema>) {
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
