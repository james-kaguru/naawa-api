import type { Env } from "@/common/env-validator";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Partial<Record<keyof Env, string>> {}
  }

  namespace Express {
    interface Locals {
      session?: Session;
      memberId?: string;
      parentId?: string;
    }
  }
}
