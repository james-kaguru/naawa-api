import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { admin, organization } from "better-auth/plugins"
import { ac, owner, admin as adminRole, member } from "./permissions.ts";
import * as schema from '../db/schema/auth.ts';
import { db } from "../db/index.ts";

export const auth = betterAuth({
  baseURL: "http://localhost:8000",
  trustedOrigins: async () => {
    return [
      'http://localhost:3000'
    ]
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  plugins: [
    admin(),
    organization({
      ac,
      roles: {
        owner,
        admin: adminRole,
        member,
      },
      dynamicAccessControl: {
        enabled: true,
      },
    })
  ]
});
