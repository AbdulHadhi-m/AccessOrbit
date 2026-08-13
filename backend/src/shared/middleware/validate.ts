import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { HttpStatus } from "../constants/http.js";
import { sendFailure } from "../utils/response.js";

type ValidationSource = "body" | "query" | "params";

export function validate(schema: ZodType, source: ValidationSource = "body"): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (result.success) {
      const target = req as Request & Record<string, unknown>;
      if (source === "query") {
        Object.defineProperty(target, "query", {
          value: result.data,
          configurable: true,
          writable: true,
        });
      } else {
        target[source] = result.data;
      }
      next();
      return;
    }

    const details = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || source,
      message: issue.message,
    }));

    sendFailure(
      res,
      HttpStatus.UNPROCESSABLE_ENTITY,
      "VALIDATION_ERROR",
      "Validation failed",
      details
    );
  };
}