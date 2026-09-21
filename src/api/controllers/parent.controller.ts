import type { Request } from "express";
import type { ParentSchema } from "../middlewares/validators/parent.validator.ts";
import { bindAll } from "../../common/utils/index.ts";
import { currentUser } from "../middlewares/auth.middleware.ts";

class ParentController {
  constructor() {
    bindAll(this);
  }

  find(req: Request<unknown, unknown, ParentSchema>) {
    return "find";
  }

  findOne(req: Request<unknown, unknown, ParentSchema>) {
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

export default new ParentController();
