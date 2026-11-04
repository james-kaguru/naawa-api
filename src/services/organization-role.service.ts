import { and, eq, inArray } from "drizzle-orm"
import { defaultRoles } from "better-auth/plugins/organization/access"
import { db, type Db } from "@/db"
import { organizationRole } from "@/db/schema/auth.schema"
import type { Permissions } from "@/common/types"

export type OrganizationRoleTable = typeof organizationRole

export class OrganizationRoleService {
  constructor(private db: Db, private organizationRole: OrganizationRoleTable) {
  }

  async findPermissions(roles: string[], organizationId: string): Promise<Permissions> {
    const permissions: Permissions = {}

    for (const name of roles) {
      const role = defaultRoles[name as keyof typeof defaultRoles]
      if (role) this.merge(permissions, role.statements)
    }

    if (roles.length === 0) return permissions

    const customRoles = await this.db
      .select({ permission: this.organizationRole.permission })
      .from(this.organizationRole)
      .where(
        and(
          eq(this.organizationRole.organizationId, organizationId),
          inArray(this.organizationRole.role, roles),
        ),
      )

    for (const { permission } of customRoles) {
      this.merge(permissions, JSON.parse(permission))
    }

    return permissions
  }

  private merge(target: Permissions, statements: Record<string, readonly string[]>) {
    for (const [resource, actions] of Object.entries(statements)) {
      target[resource] = [...new Set([...(target[resource] ?? []), ...actions])]
    }
  }
}

export const organizationRoleService = new OrganizationRoleService(db, organizationRole)
