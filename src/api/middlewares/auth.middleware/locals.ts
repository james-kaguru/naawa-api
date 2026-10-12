import { auth } from "@/auth";
import { ORGANIZATION_ID } from "@/common/constants";
import { InternalServerError } from "@/common/errors";
import { memberService, parentService, staffService } from "@/services";
import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";

type Session = typeof auth.$Infer.Session;

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

    res.locals.memberId = member.id;

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

export function currentUser(res: Response): Session["user"] {
  if (!res.locals.session) {
    throw new InternalServerError(
      "currentUser() called on a route without authorizationCheck",
    );
  }

  return res.locals.session.user;
}

export function currentMemberId(res: Response): string {
  if (!res.locals.memberId) {
    throw new InternalServerError(`Member id was not set`);
  }

  return res.locals.memberId;
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
