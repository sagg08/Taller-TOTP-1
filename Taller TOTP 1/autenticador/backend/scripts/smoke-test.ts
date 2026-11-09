import { randomBytes } from "node:crypto";
import { generatePkceCodeChallenge } from "../src/helpers/pkce";
import { generateTotp } from "../src/helpers/totp";
import { MFA_SECRET } from "../src/controllers/mfa.controller";

const baseUrl = process.env.SMOKE_URL ?? "http://127.0.0.1:4200";

async function request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    redirect: "follow",
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { text }; }
  return { status: response.status, data };
}

async function formRequest(method: string, path: string, body: Record<string, string>) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    redirect: "manual",
    body: new URLSearchParams(body).toString()
  });
  const location = response.headers.get("location");
  return { status: response.status, location };
}

function step(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` - ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = generatePkceCodeChallenge(verifier);
  step("generar PKCE", challenge.length === 43);

  const state = "state-smoke";
  const authorize = await request("GET", `/auth/oauth/authorize?response_type=code&client_id=demo&redirect_uri=manual&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`);
  step("GET authorize", authorize.status === 200);

  const authorized = await formRequest("POST", "/auth/oauth/authorize", {
    email: "demo",
    password: "demo",
    client_id: "demo",
    redirect_uri: "manual",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  const locationUrl = new URL(authorized.location ?? "", "http://127.0.0.1");
  const authorizedCode = locationUrl.searchParams.get("code");
  const authorizedState = locationUrl.searchParams.get("state");
  step("POST authorize con redirect manual y state", authorized.status === 302 && authorizedState === state && Boolean(authorizedCode));
  if (!authorizedCode) return;

  const tokenBody = {
    grant_type: "authorization_code",
    code: authorizedCode,
    redirect_uri: "manual",
    client_id: "demo",
    code_verifier: "INCORRECTO"
  };
  const wrong = await request("POST", "/auth/oauth/token", tokenBody);
  step("token con verifier incorrecto", wrong.status === 400);

  const correct = await request("POST", "/auth/oauth/token", { ...tokenBody, code_verifier: verifier });
  step("token con verifier correcto", correct.status === 200 && Boolean(correct.data.access_token));
  if (!correct.data.access_token) return;

  const profileHeaders = { authorization: `Bearer ${correct.data.access_token}` };
  const profile = await request("GET", "/api/perfil", undefined, profileHeaders);
  step("/api/perfil", profile.status === 200);

  const vaultNoElevated = await request("GET", "/api/boveda-critica", undefined, profileHeaders);
  step("/api/boveda-critica con MFA requerido", vaultNoElevated.status === 403 && vaultNoElevated.data.error === "mfa_required");

  const totp = generateTotp(MFA_SECRET);
  const mfa = await request("POST", "/auth/mfa/verify", {
    totp,
    step_up_token: correct.data.step_up_token
  });
  step("verificación TOTP", mfa.status === 200 && Boolean(mfa.data.elevated_token));
  if (!mfa.data.elevated_token) return;

  const elevatedHeaders = {
    authorization: `Bearer ${correct.data.access_token}`,
    "x-elevated-token": mfa.data.elevated_token
  };
  const elevatedVault = await request("GET", "/api/boveda-critica", undefined, elevatedHeaders);
  step("bóveda con elevated_token", elevatedVault.status === 200);

  const replay = await request("POST", "/auth/mfa/verify", {
    totp,
    step_up_token: correct.data.step_up_token
  });
  step("mismo verify (anti-replay)", replay.status === 409);

  const refreshed = await request("POST", "/auth/refresh", { refresh_token: correct.data.refresh_token });
  step("/auth/refresh", refreshed.status === 200 && Boolean(refreshed.data.refresh_token));

  const oldRefresh = await request("POST", "/auth/refresh", { refresh_token: correct.data.refresh_token });
  step("refresh viejo reutilizado", oldRefresh.status === 401);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
