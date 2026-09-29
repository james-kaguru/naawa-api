import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { ValidationError, type ValidationErrors } from "@/common/errors";

type Schemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

const SOURCES = ["body", "query", "params"] as const;

// Reject unknown keys instead of silently stripping them (top level only; nested objects need their own .strict())
const toStrict = (schema?: z.ZodType) => (schema instanceof z.ZodObject ? schema.strict() : schema);

function formatError(error: z.ZodError) {
  const isUnknownKeys = (issue: z.core.$ZodIssue) => issue.code === "unrecognized_keys" && issue.path.length === 0;

  const { fieldErrors, formErrors } = z.flattenError(
    new z.ZodError(error.issues.filter((issue) => !isUnknownKeys(issue))),
  );
  const errors: Record<string, string[] | undefined> = { ...fieldErrors };

  for (const issue of error.issues) {
    if (issue.code !== "unrecognized_keys" || !isUnknownKeys(issue)) continue;
    for (const key of issue.keys) errors[key] = ["Unrecognized field"];
  }

  if (formErrors.length) errors._root = formErrors;
  return errors;
}

export function validate(schemas: Schemas) {
  const strictSchemas = Object.fromEntries(SOURCES.map((source) => [source, toStrict(schemas[source])])) as Schemas;

  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: ValidationErrors = {};

    for (const source of SOURCES) {
      const schema = strictSchemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);

      if (!result.success) {
        errors[source] = formatError(result.error);
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
