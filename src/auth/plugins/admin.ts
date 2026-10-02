import { defaultStatements, adminAc ,userAc} from "better-auth/plugins/admin/access";
import { createAccessControl } from "better-auth/plugins/access";
import { admin } from "better-auth/plugins"

const statement = {
  ...defaultStatements,
} as const;

const systemAc = createAccessControl(statement);

const userRole = systemAc.newRole({
    ...userAc.statements,
});

const systemAdmin = systemAc.newRole({
    ...adminAc.statements,
});

const adminRole = systemAc.newRole({
  user: [statement.user[10]]
});

export const SystemRole = {
  User: 'user',
  SystemAdmin: 'systemAdmin',
  Admin: 'admin',
} as const;

export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

export const systemRoles = Object.values(SystemRole);

export const adminPlugin = admin({
  ac: systemAc,
  roles: {
    user: userRole,
    systemAdmin: systemAdmin,
    admin:adminRole
  }
})
