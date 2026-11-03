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

const staff = systemAc.newRole({
  ...userAc.statements,
});

const parent = systemAc.newRole({
  ...userAc.statements,
});

const adminRole = systemAc.newRole({
  ...adminAc.statements,
});

export const UserRoles = {
  admin: "admin",
  parent: "parent",
  staff: "staff",
} as const;

export type UserRoles = (typeof UserRoles)[keyof typeof UserRoles];

export const userRoles = Object.values(UserRoles);

export const adminPlugin = admin({
  ac: systemAc,
  roles: {
    admin: adminRole,
    staff,
    parent,
  },
});
