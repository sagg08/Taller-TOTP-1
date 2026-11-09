import { Request, Response } from "express";
import { z } from "zod";
import { signToken, verifyToken } from "../helpers/jwt";
import { verifyTotp } from "../helpers/totp";

export const MFA_SECRET = "JBSWY3DPEHPK3PXP";
export const STEP_UP_TTL = 300;

// Unica fuente del step_up_token: lo emiten el intercambio OAuth, el refresh y el 403 mfa_required.
export function signStepUpToken(subject: string): string {
  return signToken({ sub: subject, type: "step_up" }, STEP_UP_TTL, process.env.JWT_SECRET ?? "");
}

const replayCache = new Map<string, NodeJS.Timeout>();

export function verifyMfa(req: Request, res: Response): void {
  const schema = z.object({
    totp: z.string().regex(/^\d{6}$/, "TOTP debe tener 6 dígitos"),
    step_up_token: z.string().min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Datos inválidos" });
    return;
  }
  let stepUp: { sub: string; type: string };
  try {
    stepUp = verifyToken<{ sub: string; type: string }>(parsed.data.step_up_token, process.env.JWT_SECRET ?? "");
  } catch {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  if (stepUp.type !== "step_up") {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
  if (!verifyTotp(MFA_SECRET, parsed.data.totp)) {
    res.status(401).json({ error: "invalid_totp" });
    return;
  }
  const replayKey = `${stepUp.sub}:${parsed.data.totp}`;
  if (replayCache.has(replayKey)) {
    console.log("[MFA] replay detectado");
    res.status(409).json({ error: "replay_detected" });
    return;
  }
  const timeout = setTimeout(() => replayCache.delete(replayKey), 90_000);
  replayCache.set(replayKey, timeout);
  const elevatedToken = signToken({ sub: stepUp.sub, type: "elevated" }, 300, process.env.JWT_SECRET ?? "");
  console.log("[MFA] TOTP válido");
  res.status(200).json({ elevated_token: elevatedToken, expires_in: 300 });
}
