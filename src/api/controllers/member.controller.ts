import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { APIError } from "better-auth/api";
import { auth } from "../../auth/index.ts";
import { db } from "../../db/index.ts";
import { organization } from "../../db/schema/auth.ts";
import { bindAll } from "../../common/utils/index.ts";
import { currentUser } from "../middlewares/auth.middleware.ts";
import { addMemberSchema } from "../middlewares/validators/membervalidators.ts";

class MemberController {
  constructor() {
    bindAll(this);
  }

  // Adds an existing user to the organization. Better Auth's addMember is server-only
  // (no HTTP route), so the dashboard calls this instead.
  async create(req: Request, res: Response) {
    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "invalid body", status: 400 });
      return;
    }

    // Naawa has a single organization.
    const [org] = await db.select({ id: organization.id }).from(organization).limit(1);
    if (!org) {
      res.status(404).json({ message: "no organization exists yet", status: 404 });
      return;
    }

    // addMember skips permission checks, so enforce them here: site admins, or
    // organization members allowed to create members.
    const user = currentUser(res);
    const isSiteAdmin = user.role?.split(",").includes("admin") ?? false;
    if (!isSiteAdmin) {
      const { success } = await auth.api.hasPermission({
        headers: fromNodeHeaders(req.headers),
        body: { organizationId: org.id, permissions: { member: ["create"] } },
      });
      if (!success) {
        res.status(403).json({ message: "you are not allowed to add members", status: 403 });
        return;
      }
    }

    try {
      return await auth.api.addMember({
        body: {
          userId: parsed.data.userId,
          role: parsed.data.role as "member",
          organizationId: org.id,
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        res.status(error.statusCode).json({ message: error.message, status: error.statusCode });
        return;
      }
      throw error;
    }
  }
}

export default new MemberController();
