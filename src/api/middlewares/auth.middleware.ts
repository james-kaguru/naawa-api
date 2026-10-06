import { auth, type OrgPermissions } from "@/auth";
import type { SystemRole } from "@/auth/plugins/admin";
import { ORGANIZATION_ID } from "@/common/constants";
import { ForbiddenError, InternalServerError } from "@/common/errors";
import type { Req, Res } from "@/common/types/index";
import { memberService, parentService, staffService } from "@/services";
import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";

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

    await auth.api.setActiveOrganization({
      body: {
        organizationId: ORGANIZATION_ID,
      },
      headers: fromNodeHeaders(req.headers),
    });

    const member = await memberService.findByUserId(
      session.user.id,
      ORGANIZATION_ID,
    );

    await parentService
      .findByMemberId(member.id)
      .then((parent) => {
        res.locals.parentId = parent.id;
      })
      .catch(() => {});

    await staffService
      .findByMemberId(member.id)
      .then((staff) => {
        res.locals.staffId = staff.id;
      })
      .catch(() => {});
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

export interface AuthorizationCheck {
  systemRoles?: SystemRole[];
  permissions: OrgPermissions;
}

export function authorizationCheck(props: AuthorizationCheck) {
  return async (req: Req, res: Res, next: NextFunction) => {
    const user = currentUser(res);
    const userRole = user.role;

    if (!userRole)
      throw new InternalServerError(`Role not set for user ${user.id}`);

    if (props.systemRoles) {
      if (!props.systemRoles.includes(userRole as SystemRole))
        throw new ForbiddenError("Forbidden");
    }

    const { success } = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: { permissions: props.permissions },
    });

    if (!success) throw new ForbiddenError("Forbidden");

    next();
  };
}
