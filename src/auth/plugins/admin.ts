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


export const adminPlugin = admin({
  ac: systemAc,
  roles: {
    user: userRole,
    systemAdmin: systemAdmin,
    admin:adminRole
  }
})
