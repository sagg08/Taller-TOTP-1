import { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { signToken } from "../helpers/jwt";
import { signStepUpToken } from "./mfa.controller";

interface RefreshRecord { subject: string; expiresAt: number }
const refreshTokens = new Map<string, RefreshRecord>();

export function issueRefreshToken(subject: string): string {
  const token = randomBytes(32).toString("base64url");
  refreshTokens.set(token, { subject, expiresAt: Date.now() + 24 * 60 * 60_000 });
  return token;
}

export function refresh(req: Request, res: Response): void {
  const schema = z.object({ refresh_token: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Datos inválidos" });
    return;
  }
  const oldToken = parsed.data.refresh_token;
  const record = refreshTokens.get(oldToken);
  if (!record || record.expiresAt < Date.now()) {
    refreshTokens.delete(oldToken);
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  refreshTokens.delete(oldToken);
  const newToken = issueRefreshToken(record.subject);
  const ttl = Number(process.env.ACCESS_TOKEN_TTL ?? 30);
  const secret = process.env.JWT_SECRET ?? "";
  const accessToken = signToken({ sub: record.subject, type: "access" }, ttl, secret);
  console.log("[Token] refresh rotado");
  res.status(200).json({
    token_type: "Bearer",
    access_token: accessToken,
    step_up_token: signStepUpToken(record.subject),
    refresh_token: newToken,
    expires_in: ttl
  });
}

export function logout(req: Request, res: Response): void {
  const schema = z.object({ refresh_token: z.string().optional() });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: "Datos inválidos" });
    return;
  }
  if (parsed.data.refresh_token) refreshTokens.delete(parsed.data.refresh_token);
  res.status(200).json({ ok: true });
}
