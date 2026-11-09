import { Request, Response } from "express";
import { verifyToken } from "../helpers/jwt";
import { signStepUpToken } from "./mfa.controller";

export function getPerfil(req: Request, res: Response): void {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  res.status(200).json({
    nombre: "Usuario Demo",
    usuario: res.locals.auth?.sub ?? "demo",
    email: res.locals.auth?.sub ?? null,
    saldo_visible: true
  });
}

export function getVault(req: Request, res: Response): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  const elevatedHeader = req.headers["x-elevated-token"];
  const elevated = typeof elevatedHeader === "string" ? elevatedHeader : undefined;
  if (!elevated) {
    console.log("[Vault] 403 mfa_required");
    res.status(403).json({
      error: "mfa_required",
      step_up_token: signStepUpToken(res.locals.auth?.sub ?? "demo")
    });
    return;
  }
  try {
    const payload = verifyToken<{ sub: string; type: string }>(elevated, process.env.JWT_SECRET ?? "");
    if (payload.type !== "elevated") throw new Error("invalid type");
    res.status(200).json({ boveda: true, saldo: 125000, usuario: payload.sub });
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}
