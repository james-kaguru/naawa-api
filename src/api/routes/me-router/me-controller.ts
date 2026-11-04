import { ORGANIZATION_ID } from "@/common/constants";
import { NotFoundError, UnauthorizedError } from "@/common/errors";
import { bindAll } from "@/common/utils";
import type { Req, Res } from "@/common/types";
import { memberService, organizationRoleService } from "@/services";

class MeController {
  constructor() {
    bindAll(this);
  }

  async permissions(_req: Req, res: Res) {
    const session = res.locals.session;
    if (!session) throw new UnauthorizedError("Unauthorized");

    const member = await memberService
      .findByUserId(session.user.id, ORGANIZATION_ID)
      .catch((error) => {
        if (error instanceof NotFoundError) return null;
        throw error;
      });

    if (!member) return { role: null, permissions: {} };

    const roles = member.role
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);

    const permissions = await organizationRoleService.findPermissions(roles, ORGANIZATION_ID);

    return { role: member.role, permissions };
  }
}

export const meController = new MeController();
