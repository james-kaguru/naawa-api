import { BaseError } from "@/common/errors/base.error";
import ValidationError from "@/common/errors/validation.error";
import type { Req, Res } from "@/common/types";
import type { NextFunction } from "express";

export default function errorMiddleware(err: Error, req: Req, res: Res, next: NextFunction) {
  // console.log(err);

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

  res.status(500).json({
    status: 500,
    message: "Internal Server Error",
  })
}
