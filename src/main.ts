import ExpressServer from "./api/server.ts"

(async () => {
  const server = new ExpressServer();

  await server.init();
})().catch((err) => {
  // Drizzle wraps driver failures in a DrizzleQueryError whose message is just
  // the SQL — the actionable part (ECONNREFUSED, auth failure) is the cause.
  console.error(err instanceof Error ? err.message : err);

  if (err instanceof Error && err.cause instanceof Error) {
    console.error(`Caused by: ${err.cause.message}`);
  }

  process.exit(1);
})
