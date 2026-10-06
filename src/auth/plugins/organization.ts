import { organization } from "better-auth/plugins";

import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

export const orgPermisstionStatement = {
  ...defaultStatements,
  parent: ["create", "list", "update"],
  child: ["create", "list", "update", "create:own", "list:own", "update:own"],
  childrenCentre: ["create", "list", "update"],
  enrollment: ["create", "list", "update"],
  attendance: ["create", "list", "update", "list:own", "update:own"],
  activity: ["create", "list", "update", "list:own", "update:own"],
  incident: ["create", "list", "update", "list:own", "update:own"],
} as const;

export type OrgPermissionStatement = typeof orgPermisstionStatement;

export type OrgPermissions = {
  [K in keyof OrgPermissionStatement]?: OrgPermissionStatement[K][number][];
};

export const ac = createAccessControl(orgPermisstionStatement);

export const member = ac.newRole({
  ...memberAc.statements,
});

export const admin = ac.newRole({
  ...adminAc.statements,
});

export const owner = ac.newRole({
  ...ownerAc.statements,
  parent: ["create", "list", "update"],
  child: ["create", "list", "update", "create:own", "list:own", "update:own"],
  activity: ["create", "list", "update"],
  incident: ["create", "list", "update"],
});

export const organizationPlugin = organization({
  ac,
  roles: {
    owner,
    admin,
    member,
  },
  dynamicAccessControl: {
    enabled: true,
  },
});
