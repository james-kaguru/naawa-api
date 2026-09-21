import { defaultStatements } from "better-auth/plugins/organization/access";

export const permissions = {
  ...defaultStatements,
  parent: ["create", "read", "list", "update", "delete"],
  child: ["create", "read", "list", "update", "delete"],
  activity: ["create", "read", "list", "update", "delete"],
  incident: ["create", "read", "list", "update", "delete"],
} as const;
