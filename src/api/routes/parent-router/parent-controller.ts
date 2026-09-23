import type { Request } from "express";
import type { CreateParentSchema, FindParentsSchema } from "./parent.request.ts";
import { bindAll } from "@/common/utils";
import { currentUser } from "../../middlewares/auth.middleware.ts";
import type { Req } from "@/common/types";
import { parentService, type ParentService } from "@/services";
import { auth } from "@/auth";
import { ORGANIZATION_ID } from "@/common/constants";

class ParentController {
  constructor(private parentService: ParentService) {
    bindAll(this);
  }

  async create(req: Req<{ body: CreateParentSchema }>) {
    const body = req.body;

    const { user } = await auth.api.createUser({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
        role: "user",
      },
    });

    const data = await auth.api.addMember({
      body: {
        userId: user.id,
        role: ["parent"],
        organizationId: ORGANIZATION_ID,
      },
    });

    console.log(data)
    return "parent"

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
