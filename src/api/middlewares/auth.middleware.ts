import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth/index.ts";
import { staffService } from "@/services";
import { ORGANIZATION_ID } from "@/common/constants";
import { NotFoundError, ForbiddenError, UnauthorizedError } from "@/common/errors";

type Session = typeof auth.$Infer.Session & {
  staffId?: string;
};

declare global {
  namespace Express {
    interface Locals {
      session?: Session;
    }
  }
}

export async function loadSession(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (session) {
    res.locals.session = session;
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

export async function loadStaff(req: Request<{ childrenCentreId: string }>, res: Response, next: NextFunction) {
  const session = res.locals.session;
  if (!session) throw new UnauthorizedError("unauthorized");

  const { members } = await auth.api.listMembers({
    query: {
      organizationId: ORGANIZATION_ID,
      filterField: "userId",
      filterOperator: "eq",
      filterValue: session.user.id,
    },
    headers: fromNodeHeaders(req.headers),
  });

  const [member] = members;
  if (!member) throw new ForbiddenError("You are not a member of this organization");

  const staff = await staffService.findByMemberId(member.id, req.params.childrenCentreId).catch((error) => {
    if (error instanceof NotFoundError) throw new ForbiddenError("You are not a staff member at this children centre");
    throw error;
  });

  session.staffId = staff.id;

  next();
}

export function currentUser(res: Response): Session["user"] {
  if (!res.locals.session) {
    throw new Error("currentUser() called on a route without requireAuth");
  }

  return res.locals.session.user;
}

export function currentStaffId(res: Response): string {
  if (!res.locals.session?.staffId) {
    throw new Error("currentStaffId() called on a route without loadStaff");
  }

  return res.locals.session.staffId;
}
