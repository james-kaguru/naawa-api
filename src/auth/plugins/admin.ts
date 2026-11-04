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

export const Role = {
  admin: "admin",
  user: "user",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const roles = Object.values(Role);

export const adminPlugin = admin({
  ac: systemAc,
  roles: {
    admin: adminRole,
    user,
  },
});
