import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Locals {
      requestId: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}