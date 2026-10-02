import type { Request } from "express";
import type {
  CreateParentSchema,
  FindParentsSchema,
  UpdateParentSchema,
} from "./parent.request.ts";
import { bindAll } from "@/common/utils";
import {
  currentParentId,
  currentUser,
} from "../../middlewares/auth.middleware.ts";
import type { Req, Res } from "@/common/types";
import {
  childService,
  parentService,
  type ParentService,
  type ChildService,
} from "@/services";
import { auth } from "@/auth";
import { ORGANIZATION_ID } from "@/common/constants";
import { fromNodeHeaders } from "better-auth/node";
import { BadRequestError } from "@/common/errors";

class ParentController {
  constructor(
    private parentService: ParentService,
    private childService: ChildService,
  ) {
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
      phoneNumber: body.phoneNumber,
    });

    return parent;
  }

  async find(req: Req<{ query: FindParentsSchema }>) {
    return this.parentService.find(req.query);
  }

  async findOne(req: Req<{ params: { id: string } }>) {
    return this.parentService.findOne(req.params.id);
  }

  async findChildren(req: Req, res: Res) {
    const parentId = currentParentId(res);

    const { data } = await this.childService.find({
      paginate: false,
      parentId,
      page: 1,
      perPage: 100,
    });

    return data;
  }

  async createChild() {}

  async update(req: Req<{ params: { id: string }; body: UpdateParentSchema }>) {
    await this.parentService.findOne(req.params.id);

    if (Object.keys(req.body).length === 0)
      throw new BadRequestError("No values to update");

    if (req.body.name) {
      console.log(fromNodeHeaders(req.headers));
      const userId = await this.parentService.findUserId(req.params.id);

      await auth.api.adminUpdateUser({
        body: {
          userId,
          data: { name: req.body.name },
        },
        headers: fromNodeHeaders(req.headers),
      });
    }

    const parent = await this.parentService.update(req.params.id, {
      emergencyContact: req.body.emergencyContact,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
    });

    return parent;
  }
}

export const parentController = new ParentController(
  parentService,
  childService,
);
