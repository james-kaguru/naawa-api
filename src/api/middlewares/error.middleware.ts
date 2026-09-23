import { BaseError } from "@/common/errors/base.error";
import ValidationError from "@/common/errors/validation.error";
import type { Req, Res } from "@/common/types";
import type { NextFunction } from "express";
import { isAPIError } from "better-auth/api";

export default function errorMiddleware(err: Error, req: Req, res: Res, next: NextFunction) {

  if (err instanceof ValidationError) {
    res.status(err.status).json({
      status: err.status,
      message: err.message,
      errors: err.errors,
    })
    return
  }

  if (err instanceof BaseError) {
    if (err.status === 500) {
      res.status(500).json({
        status: 500,
        message: "Internal Server Error",
      })
      return;
    }

    res.status(err.status).json({
      status: err.status,
      message: err.message,
    })
    return
  }


  if (isAPIError(err)) {
    res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.body?.message ?? err.message,
      code: err.body?.code,
    })
    return
  }

  console.log(err);

  res.status(500).json({
    status: 500,
    message: "Internal Server Error",
  })
}
