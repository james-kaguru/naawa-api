import { organization } from "better-auth/plugins";

import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

export const orgPermisstionStatement = {
  ...defaultStatements,
  parent: ["create", "list", "update"],
  child: ["create", "list", "update", "create:own", "list:own", "update:own"],
  childrenCentre: ["create", "list", "update"],
  enrollment: ["create", "list", "update", "list:own"],
  staff: ["create", "list", "delete"],
  attendance: ["create", "list", "update", "list:own"],
  activity: ["create", "list", "update", "list:own"],
  incident: ["create", "list", "update", "list:own"],
  thread: ["create", "list", "update", "list:own"],
  message: ["create:own", "list", "update:own"],
  invoice: ["create", "list", "update", "delete", "list:own"],
  billingRun: ["create", "list"],
} as const;

export const defaultParentPermissions: OrgPermissions = {
  child: ["create:own", "list:own", "update:own"],
  childrenCentre: ["list"],
} as const;

export type OrgPermissionStatement = typeof orgPermisstionStatement;

export type OrgPermissions = {
  [K in keyof OrgPermissionStatement]?: OrgPermissionStatement[K][number][];
};

export const ac = createAccessControl(orgPermisstionStatement);

export const organizationPlugin = organization({
  ac,
  dynamicAccessControl: {
    enabled: true,
  },
});
