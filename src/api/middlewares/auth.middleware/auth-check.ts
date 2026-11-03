import { auth, type OrgPermissions } from "@/auth";
import type { UserRoles } from "@/auth/plugins/admin";
import {
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@/common/errors";
import type { Req, Res } from "@/common/types/index";
import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction } from "express";
import { currentUser } from "./locals";

export interface AuthorizationCheck {
  systemRoles?: UserRoles[];
  permissions: OrgPermissions;
}

export type AuthFn = (req: Req, res: Res) => Promise<void>;

export function authorizationCheck(props: AuthorizationCheck, authFn?: AuthFn) {
  return async (req: Req, res: Res, next: NextFunction) => {
    if (!res.locals.session) {
      throw new UnauthorizedError("Unauthorized");
    }

    const user = currentUser(res);
    const userRole = user.role;

    if (!userRole)
      throw new InternalServerError(`Role not set for user ${user.id}`);

    if (props.systemRoles) {
      if (!props.systemRoles.includes(userRole as UserRoles))
        throw new ForbiddenError("Forbidden");
    }

    if (props.permissions) {
      const { success } = await auth.api.hasPermission({
        headers: fromNodeHeaders(req.headers),
        body: { permissions: props.permissions },
      });

      if (!success) throw new ForbiddenError("Forbidden");
    }

    if (authFn) {
      await authFn(req, res).catch((e) => {
        if (e instanceof InternalServerError) throw e;

        throw new ForbiddenError(e.message);
      });
    }

    next();
  };
}
