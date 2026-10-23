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

const userRole = systemAc.newRole({
  ...userAc.statements,
});

const staff = systemAc.newRole({
  ...userAc.statements,
});

const parent = systemAc.newRole({
  ...userAc.statements,
});

const systemAdmin = systemAc.newRole({
  ...adminAc.statements,
});

const adminRole = systemAc.newRole({
  user: [statement.user[10]],
});

export const UserRoles = {
  user: "user",
  systemAdmin: "systemAdmin",
  admin: "admin",
  parent: "parent",
  staff: "staff",
} as const;

export type UserRoles = (typeof UserRoles)[keyof typeof UserRoles];

export const userRoles = Object.values(UserRoles);

export const adminPlugin = admin({
  ac: systemAc,
  roles: {
    user: userRole,
    systemAdmin: systemAdmin,
    admin: adminRole,
    staff,
    parent,
  },
});
