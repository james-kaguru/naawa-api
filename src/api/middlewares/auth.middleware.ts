import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth/index.ts";

type Session = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Locals {
      session?: Session;
    }
  }
}

export async function loadSession(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (session) {
    res.locals.session = session;
  }

  next();
}

export function requireAuth(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.session) {
    res.status(401).json({
      message: "unauthorized",
      status: 401,
    });
    return;
  }

  next();
}

export function currentUser(res: Response): Session["user"] {
  if (!res.locals.session) {
    throw new Error("currentUser() called on a route without requireAuth");
  }

  return res.locals.session.user;
}
