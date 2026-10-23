import type { Env } from "@/common/env-validator";
import { auth } from "@/auth";

type Session = typeof auth.$Infer.Session;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Partial<Record<keyof Env, string>> {}
  }

  namespace Express {
    interface Locals {
      session?: Session;
      memberId?: string;
      parentId?: string;
      staffId?: string;
    }
  }
}
