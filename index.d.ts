import type { Env } from "@/common/env-validator";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Partial<Record<keyof Env, string>> {}
  }
}
