import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyToken } from "../helpers/jwt";

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  try {
    const payload = verifyToken<{ sub: string; type: string }>(token, process.env.JWT_SECRET ?? "");
    res.locals.auth = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "token_expired" });
    } else {
      res.status(401).json({ error: "invalid_token" });
    }
  }
}
