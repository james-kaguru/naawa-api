import type { Request, RequestHandler, Response } from "express";

export function handle<Req extends Request<any, any, any, any>>(
  fn: (req: Req, res: Response) => unknown,
  status = 200,
): RequestHandler {
  return async (req, res) => {
    const result = await fn(req as Req, res);
    if (!res.headersSent) {
      res.status(status).json(result);
    }
  };
}
