import { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { loginTemplate } from "../templates/login.html";
import { signToken } from "../helpers/jwt";
import { verifyPkceVerifier } from "../helpers/pkce";
import { issueRefreshToken } from "./token.controller";
import { signStepUpToken } from "./mfa.controller";

const authorizationSchema = z.object({
  response_type: z.enum(["code"]).optional(),
  client_id: z.string().min(1),
  redirect_uri: z.string().min(1),
  state: z.string().min(1),
  code_challenge: z.string().min(43),
  code_challenge_method: z.enum(["S256"])
});

const authorizePostSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  client_id: z.string().min(1),
  redirect_uri: z.string().min(1),
  state: z.string().min(1),
  code_challenge: z.string().min(43),
  code_challenge_method: z.literal("S256")
});

export interface AuthCodeRecord {
  challenge: string;
  redirectUri: string;
  state: string;
  subject: string;
  expiresAt: number;
}

const authCodes = new Map<string, AuthCodeRecord>();
const pendingChallenges = new Map<string, string>();

export function getAuthorize(req: Request, res: Response): void {
  const parsed = authorizationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Parámetros inválidos" });
    return;
  }
  pendingChallenges.set(parsed.data.state, parsed.data.code_challenge);
  res.status(200).type("html").send(loginTemplate({
    state: parsed.data.state,
    redirectUri: parsed.data.redirect_uri,
    codeChallenge: parsed.data.code_challenge,
    clientId: parsed.data.client_id,
    codeChallengeMethod: parsed.data.code_challenge_method
  }));
}

export function postAuthorize(req: Request, res: Response): void {
  const parsed = authorizePostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).type("html").send(loginTemplate({
      state: typeof req.body?.state === "string" ? req.body.state : "",
      redirectUri: typeof req.body?.redirect_uri === "string" ? req.body.redirect_uri : "manual",
      codeChallenge: typeof req.body?.code_challenge === "string" ? req.body.code_challenge : "",
      clientId: typeof req.body?.client_id === "string" ? req.body.client_id : "demo",
      codeChallengeMethod: "S256",
      error: "Faltan datos o los parámetros de autorización son inválidos."
    }));
    return;
  }
  const validCredentials =
    (parsed.data.email === "demo" || parsed.data.email === "demo@unisabana.edu.co")
    && parsed.data.password === "demo";
  if (!validCredentials) {
    res.status(401).type("html").send(loginTemplate({
      state: parsed.data.state,
      redirectUri: parsed.data.redirect_uri,
      codeChallenge: parsed.data.code_challenge,
      clientId: parsed.data.client_id,
      codeChallengeMethod: parsed.data.code_challenge_method,
      error: "Usuario o contraseña incorrectos."
    }));
    return;
  }
  const redirectUri = parsed.data.redirect_uri;
  const state = parsed.data.state;
  const code = randomBytes(24).toString("base64url");
  const challenge = parsed.data.code_challenge || pendingChallenges.get(parsed.data.state) || "";
  if (!challenge) {
    res.status(400).type("html").send(loginTemplate({
      state: parsed.data.state,
      redirectUri,
      codeChallenge: "",
      clientId: parsed.data.client_id,
      codeChallengeMethod: "S256",
      error: "Falta el parámetro PKCE code_challenge."
    }));
    return;
  }
  authCodes.set(code, {
    challenge,
    redirectUri,
    state,
    subject: parsed.data.email,
    expiresAt: Date.now() + 5 * 60_000
  });
  console.log(`[OAuth] code emitido para ${parsed.data.email}`);
  const separator = redirectUri.includes("?") ? "&" : "?";
  const redirectUrl = `${redirectUri}${separator}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  console.log(`[OAuth] redirect_uri recibido: ${redirectUri}`);
  console.log(`[OAuth] redirigiendo a: ${redirectUrl}`);
  res.redirect(302, redirectUrl);
}

export function exchangeAuthorizeCode(req: Request, res: Response): void {
  const schema = z.object({
    grant_type: z.literal("authorization_code"),
    code: z.string().min(1),
    code_verifier: z.string().min(43),
    redirect_uri: z.string().min(1),
    client_id: z.string().min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Datos inválidos" });
    return;
  }
  const record = authCodes.get(parsed.data.code);
  if (!record || record.expiresAt < Date.now()) {
    res.status(400).json({ error: "invalid_grant", message: "Authorization code inválido o expirado" });
    return;
  }
  if (!verifyPkceVerifier(parsed.data.code_verifier, record.challenge)) {
    res.status(400).json({ error: "invalid_grant", message: "code_verifier incorrecto" });
    return;
  }
  authCodes.delete(parsed.data.code);
  const secret = process.env.JWT_SECRET ?? "";
  const accessTtl = Number(process.env.ACCESS_TOKEN_TTL ?? 30);
  const accessToken = signToken({ sub: record.subject, type: "access" }, accessTtl, secret);
  const stepUpToken = signStepUpToken(record.subject);
  const refreshToken = issueRefreshToken(record.subject);
  console.log("[OAuth] token intercambiado");
  res.status(200).json({
    token_type: "Bearer",
    access_token: accessToken,
    step_up_token: stepUpToken,
    refresh_token: refreshToken,
    expires_in: accessTtl
  });
}
