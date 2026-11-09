function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function loginTemplate(options: {
  state: string;
  redirectUri?: string;
  codeChallenge?: string;
  clientId?: string;
  codeChallengeMethod?: string;
  error?: string;
}): string {
  const state = escapeHtml(options.state ?? "");
  const redirectUri = escapeHtml(options.redirectUri ?? "manual");
  const codeChallenge = escapeHtml(options.codeChallenge ?? "");
  const clientId = escapeHtml(options.clientId ?? "demo");
  const method = escapeHtml(options.codeChallengeMethod ?? "S256");
  const error = options.error ? `<div class="error">${escapeHtml(options.error)}</div>` : "";
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Acceso seguro</title><style>
body{margin:0;background:#0F2A4A;font-family:system-ui;color:#fff;display:grid;place-items:center;min-height:100vh}
.card{width:min(380px,calc(100% - 40px));background:#fff;color:#0F2A4A;border-radius:12px;padding:32px;box-shadow:0 12px 40px #071426}
h1{margin-top:0;color:#0F2A4A;border-bottom:3px solid #D4A017;padding-bottom:12px}
label{display:block;margin:18px 0 6px;font-weight:700}input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #b7c0ca;border-radius:6px}
button{width:100%;margin-top:22px;padding:13px;border:0;border-radius:6px;background:#D4A017;color:#0F2A4A;font-weight:800;font-size:16px;cursor:pointer}.error{margin-bottom:12px;background:#fee2e2;color:#991b1b;padding:10px;border-radius:6px}
</style></head><body><form class="card" method="POST" action="/oauth/authorize">
<input type="hidden" name="state" value="${state}">
<input type="hidden" name="redirect_uri" value="${redirectUri}">
<input type="hidden" name="code_challenge" value="${codeChallenge}">
<input type="hidden" name="code_challenge_method" value="${method}">
<input type="hidden" name="client_id" value="${clientId}">
<h1>Banco Seguro</h1>${error}<label>Email</label><input name="email" type="email" value="demo@unisabana.edu.co" autocomplete="email">
<label>Contraseña</label><input name="password" type="password" value="demo" autocomplete="current-password">
<button type="submit">Iniciar sesión</button></form></body></html>`;
}
