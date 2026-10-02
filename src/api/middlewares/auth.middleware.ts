import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth/index.ts";
import { memberService, parentService, staffService } from "@/services";
import { ORGANIZATION_ID } from "@/common/constants";
import {
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  InternalServerError,
} from "@/common/errors";
import type { SystemRole } from "@/auth/plugins/admin";
import type { Req, Res } from "@/common/types/index";

type Session = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Locals {
      session?: Session;
      parentId?: string;
    }
  }
}

export async function loadLocals(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (session) {
    res.locals.session = session;

    const member = await memberService.findByUserId(
      session.user.id,
      ORGANIZATION_ID,
    );

    await parentService
      .findByMemberId(member.id)
      .then((parent) => {
        res.locals.parentId = parent.id;
      })
      .catch();

    await staffService
      .findByMemberId(member.id)
      .then((staff) => {
        res.locals.staffId = staff.id;
      })
      .catch();
  }

  next();
}

export function requireAuth(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.session) {
    res.status(401).json({
      message: "Unauthorized",
      status: 401,
    });
    return;
  }

  next();
}

export function currentUser(res: Response): Session["user"] {
  if (!res.locals.session) {
    throw new Error("currentUser() called on a route without requireAuth");
  }

  return res.locals.session.user;
}

export function currentStaffId(res: Response): string {
  if (!res.locals.staffId) {
    throw new InternalServerError(`Staff id was not set`);
  }

  return res.locals.staffId;
}

export function currentParentId(res: Response): string {
  if (!res.locals.parentId) {
    throw new InternalServerError(`Parent id was not set`);
  }

  return res.locals.parentId;
}

export function systemRoleCheck(roles: SystemRole[]) {
  return (req: Req, res: Res, next: NextFunction) => {
    const user = currentUser(res);
    const userRole = user.role;

    if (!userRole)
      throw new InternalServerError(`Role not set for user ${user.id}`);

    if (!roles.includes(userRole as SystemRole))
      throw new ForbiddenError("Forbidden");

    next();
  };
}
