import type { NextFunction, Request, Response } from "express";
import z from "zod";
import ValidationError, { type ValidationErrors } from "@/common/errors/validation.error";

type Schemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: ValidationErrors = {};

    for (const source of ["body", "query", "params"] as const) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);

      if (!result.success) {
        const { fieldErrors, formErrors } = z.flattenError(result.error);
        errors[source] = formErrors.length ? { ...fieldErrors, _root: formErrors } : fieldErrors;
        continue;
      }

      // req.query is a getter in Express 5, so it has to be redefined rather than assigned
      Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true, enumerable: true });
    }

    if (Object.keys(errors).length) {
      return next(new ValidationError(errors));
    }

    next();
  };
}
