import { auth, type OrgPermissions } from "@/auth";
import type { SystemRole } from "@/auth/plugins/admin";
import { ORGANIZATION_ID } from "@/common/constants";
import { ForbiddenError, InternalServerError } from "@/common/errors";
import type { Req, Res } from "@/common/types/index";
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
