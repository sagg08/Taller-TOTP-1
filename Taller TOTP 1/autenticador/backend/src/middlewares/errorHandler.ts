import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "invalid_request", message: error.issues[0]?.message ?? "JSON inválido" });
    return;
  }
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "server_error" });
}
