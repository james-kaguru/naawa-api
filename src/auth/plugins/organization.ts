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
  parent: ["create", "read", "list", "update", "delete"],
  child: ["create", "read", "list", "update", "delete"],
  ownChild: ["create", "read", "list", "update", "delete"],
  activity: ["create", "read", "list", "update", "delete"],
  incident: ["create", "read", "list", "update", "delete"],
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
  parent: ["create", "read", "list", "update", "delete"],
  child: ["create", "read", "list", "update", "delete"],
  ownChild: ["create", "read", "list", "update", "delete"],
  activity: ["create", "read", "list", "update", "delete"],
  incident: ["create", "read", "list", "update", "delete"],
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
