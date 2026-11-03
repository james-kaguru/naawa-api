import "dotenv/config";

import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import routes from "./routes/index.ts";
import { Server } from "http";
import { validateEnv, getEnv } from "../common/env-validator.ts";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth/index.ts";
import cors from "cors";
import { loadLocals } from "./middlewares/auth.middleware/index.ts";
import errorMiddleware from "./middlewares/error.middleware.ts";

export default class ExpressServer {
  app: Express;
  server: Server | null = null;

  constructor() {
    this.app = express();
  }

  async init() {
    validateEnv();

    this.handleCors();

    this.registerAuthRoutes();

    this.handleJson();
    this.handleSession();

    this.registerRoutes();
    this.handleNotFound();
    this.handleErrors();

    this.listen();
  }

  handleCors() {
    this.app.use(
      cors({
        // TODO(insecure): reflects ANY origin with credentials. Restore
        // `origin: getEnv().CORS_ORIGINS` before going to production.
        // origin: true,
        origin: getEnv().CORS_ORIGINS,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Specify allowed HTTP methods
        credentials: true, // Allow credentials (cookies, authorization headers, etc.)
      }),
    );
  }

  handleJson() {
    this.app.use(express.json());
  }

  handleSession() {
    this.app.use(loadLocals);
  }

  registerAuthRoutes() {
    this.app.all("/api/auth/*splat", toNodeHandler(auth));
  }
  registerRoutes() {
    this.app.use("/", routes);
  }

  handleNotFound() {
    this.app.use((req, res) => {
      res.status(404).json({
        message: `route ${req.url} not found`,
        status: 404,
      });
    });
  }

  handleErrors() {
    this.app.use(errorMiddleware);
  }

  listen() {
    const { PORT } = getEnv();

    this.server = this.app.listen(PORT);

    console.log(`Server listening on ${PORT}`);

    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
    process.on("SIGINT", () => this.shutdown("SIGINT"));
  }

  shutdown(signal: string) {
    console.log(`${signal} received, shutting down`);

    // close() stops accepting new connections but leaves the pg pool's sockets
    // open, which keeps the event loop alive — the pool has to be drained too.
    this.server?.close(async (err) => {
      if (err) console.error(err);

      process.exit(err ? 1 : 0);
    });
  }
}
