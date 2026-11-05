import { db } from "@/db";
import * as schema from "@/db/schema/auth.schema";
import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { organizationPlugin, adminPlugin } from "./plugins";
import { getEnv } from "@/common/env-validator";

export const auth = betterAuth({
  // baseURL: getEnv().BETTER_AUTH_URL,
  // TODO(insecure): trusts whatever origin the request came from (disables
  // Better Auth's origin/CSRF check). Restore `getEnv().CORS_ORIGINS` before production.
  trustedOrigins: (request) => [request?.headers.get("origin")],
  // trustedOrigins: getEnv().CORS_ORIGINS,
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
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true, // required with SameSite=None (Cloud Run is HTTPS, so fine)
      partitioned: true, // CHIPS, helps with Chrome's third-party cookie restrictions
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
