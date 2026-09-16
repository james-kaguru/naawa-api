import * as z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "must be a postgres:// or postgresql:// connection string",
  }),
})

export type Env = z.infer<typeof envSchema>;

let env: Env | undefined;

/**
 * Parses process.env against the schema. Throws with every problem listed at
 * once, so a boot with three bad vars reports three, not one per restart.
 * Call once, at the very top of startup.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }

  env = result.data;

  return env;
}

/** The validated env. Throws if read before validateEnv() has run. */
export function getEnv(): Env {
  if (!env) {
    throw new Error("getEnv() called before validateEnv()");
  }

  return env;
}
