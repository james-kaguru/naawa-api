import { db } from "@/db";
import * as schema from "@/db/schema/auth.schema";
import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { organizationPlugin, adminPlugin } from "./plugins";

export const auth = betterAuth({
  baseURL: "http://localhost:8001",
  trustedOrigins: async () => {
    return ["http://localhost:3001"];
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
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
    adminPlugin,
    organizationPlugin,
    apiKey({
      enableSessionForAPIKeys: true,
      rateLimit: {
        enabled: false,
      },
    }),
  ],
});

export type IAuth = typeof auth;
