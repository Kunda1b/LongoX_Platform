import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema, ZodError } from "zod";

type RequestSource = "body" | "query" | "params";

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
    .join("; ");
}

export function validateRequest(
  schema: ZodSchema,
  source: RequestSource = "body",
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: formatZodError(result.error),
      });
      return;
    }
    req[source] = result.data;
    next();
  };
}
