import "dotenv/config";
import express from "express";
import cors from "cors";
import { getAuthorize, postAuthorize, exchangeAuthorizeCode } from "./controllers/oauth.controller";
import { refresh, logout } from "./controllers/token.controller";
import { verifyMfa } from "./controllers/mfa.controller";
import { getVault, getPerfil } from "./controllers/vault.controller";
import { getQr } from "./controllers/dev.controller";
import { authGuard } from "./middlewares/authGuard";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.get("/auth/oauth/authorize", getAuthorize);
app.post("/auth/oauth/authorize", postAuthorize);
app.get("/oauth/authorize", getAuthorize);
app.post("/oauth/authorize", postAuthorize);
app.post("/auth/oauth/token", exchangeAuthorizeCode);
app.post("/auth/refresh", refresh);
app.post("/auth/logout", logout);
app.post("/auth/mfa/verify", verifyMfa);
app.get("/api/perfil", authGuard, getPerfil);
app.get("/api/boveda-critica", authGuard, getVault);
app.get("/dev/qr", getQr);

app.use(errorHandler);

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 4200);
app.listen(port, host, () => {
  console.log(`Backend authentication listening at http://${host}:${port}`);
  console.log(`LAN URL: http://192.168.40.11:${port}`);
});
