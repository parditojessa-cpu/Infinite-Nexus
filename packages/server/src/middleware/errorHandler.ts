import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error(err);
  return res.status(500).json({ error: message });
}

export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Req, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
