import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";
import { permissions } from "./permissions";

export const ac = createAccessControl(permissions);

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
  activity: ["create", "read", "list", "update", "delete"],
  incident: ["create", "read", "list", "update", "delete"],
});
