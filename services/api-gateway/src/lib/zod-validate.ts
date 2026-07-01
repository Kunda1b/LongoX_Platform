import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      const zodError = err as ZodError;
      res.status(400).json({
        error: "Validation failed",
        details: zodError.issues?.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })) ?? [{ path: "", message: "Invalid request", code: "invalid" }],
      });
    }
  };
}
