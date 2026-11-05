import { ORGANIZATION_ID } from "@/common/constants";
import { InternalServerError, NotFoundError } from "@/common/errors";
import { bindAll } from "@/common/utils";
import type { UserAuthInfo, Req, Res } from "@/common/types";
import type { Role } from "@/auth";
import {
  memberService,
  organizationRoleService,
  parentService,
  staffService,
} from "@/services";
import { currentUser } from "../../middlewares/auth.middleware/index.ts";

const orNull = <T>(promise: Promise<T>): Promise<T | null> =>
  promise.catch((error) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  });

class MeController {
  constructor() {
    bindAll(this);
  }

  async findMe(_req: Req, res: Res): Promise<UserAuthInfo> {
    const user = currentUser(res);

    if (!user.role)
      throw new InternalServerError(`Role not set for user ${user.id}`);

    const member = await memberService.findByUserId(user.id, ORGANIZATION_ID);

    const [staff, parent, permissions] = await Promise.all([
      orNull(staffService.findByMemberId(member.id)),
      orNull(parentService.findByMemberId(member.id)),
      organizationRoleService.findPermissions(
        this.memberRoles(member.role),
        ORGANIZATION_ID,
      ),
    ]);

    return {
      role: user.role as Role,
      staffId: staff?.id ?? null,
      parentId: parent?.id ?? null,
      permissions,
    };
  }

  private memberRoles(role: string): string[] {
    return role
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }
}

export const meController = new MeController();
