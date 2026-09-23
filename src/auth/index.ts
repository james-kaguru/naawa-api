import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { admin, organization } from "better-auth/plugins"
import { ac, owner, admin as adminRole, member } from "./roles.ts";
import * as schema from '../db/schema/auth.schema.ts';
import { db } from "../db/index.ts";
import { apiKey } from "@better-auth/api-key";
import { createAuthMiddleware } from "better-auth/api";
import { parentService } from "@/services"
import { ORGANIZATION_ID } from "@/common/constants/index.ts";

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
    //@ts-expect-error
    apiKey({
      enableSessionForAPIKeys: true,
    })
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (!newSession) return;

        const { user } = newSession;

        const member = await auth.api.addMember({
          body: {
            userId: user.id,
            role: ["parent"],
            organizationId: ORGANIZATION_ID,
          },
        });

        await parentService.create({
          memberId: member.id,
          name: user.name,
        });
      }

    }),
  }
});

export type IAuth = typeof auth
