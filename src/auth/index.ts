import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { admin, organization } from "better-auth/plugins"
import { ac, owner, admin as adminRole, member } from "./roles.ts";
import * as schema from '@/db/schema/auth.schema.ts';
import { db } from "@/db";
import { apiKey } from "@better-auth/api-key";

export const auth = betterAuth({
  baseURL: "http://localhost:8001",
  trustedOrigins: async () => {
    return [
      'http://localhost:3001'
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
    }),
    apiKey({
      enableSessionForAPIKeys: true,
      rateLimit: {
        enabled: false
      }
    })
  ]
});

export type IAuth = typeof auth
