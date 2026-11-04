import {
  defaultStatements,
  adminAc,
  userAc,
} from "better-auth/plugins/admin/access";
import { createAccessControl } from "better-auth/plugins/access";
import { admin } from "better-auth/plugins";

const statement = {
  ...defaultStatements,
} as const;

const systemAc = createAccessControl(statement);

const user = systemAc.newRole({
  ...userAc.statements,
});

const adminRole = systemAc.newRole({
  ...adminAc.statements,
});

export const Roles = {
  admin: "admin",
  user: "user",
} as const;

export type Roles = (typeof Roles)[keyof typeof Roles];

export const roles = Object.values(Roles);

export const adminPlugin = admin({
  ac: systemAc,
  roles: {
    admin: adminRole,
    user,
  },
});
