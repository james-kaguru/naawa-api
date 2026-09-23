import type { Request } from "express";
import type { CreateParentSchema, FindParentsSchema, UpdateParentSchema } from "./parent.request.ts";
import { bindAll } from "@/common/utils";
import { currentUser } from "../../middlewares/auth.middleware.ts";
import type { Req } from "@/common/types";
import { parentService, type ParentService } from "@/services";
import { auth } from "@/auth";
import { ORGANIZATION_ID } from "@/common/constants";
import { fromNodeHeaders } from "better-auth/node";

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

    const member = await auth.api.addMember({
      body: {
        userId: user.id,
        role: ["parent"],
        organizationId: ORGANIZATION_ID,
      },
    });


    const parent = await this.parentService.create({
      memberId: member.id,
      name: body.name
    })

    return parent;

  }

  async find(req: Req<{ query: FindParentsSchema }>) {
    return this.parentService.find(req.query);
  }

  async findOne(req: Req<{ params: { id: string } }>) {
    return this.parentService.findOne(req.params.id);
  }

  async update(req: Req<{ params: { id: string }, body: UpdateParentSchema }>) {
    await this.parentService.findOne(req.params.id);

    await auth.api.updateUser({
      body: {
        name: req.body.name
      },
      headers: fromNodeHeaders(req.headers),
    })

    const parent = await this.parentService.update(req.params.id, {
      name: req.body.name,
    })

    return parent;
  }

}

export const parentController = new ParentController(parentService);
