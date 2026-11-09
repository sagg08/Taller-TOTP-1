import { Request, Response } from "express";
import QRCode from "qrcode";
import { MFA_SECRET } from "./mfa.controller";

export async function getQr(req: Request, res: Response, next: (error?: unknown) => void): Promise<void> {
  try {
    const scheme = `otpauth://totp/UniSabana:estudiante@unisabana.edu.co?secret=${MFA_SECRET}&issuer=UniSabana`;
    const dataUrl = await QRCode.toDataURL(scheme);
    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QR TOTP - UniSabana</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #F1F5F9; font-family: system-ui, sans-serif; color: #0F2A4A; }
    main { width: min(680px, calc(100% - 40px)); box-sizing: border-box; text-align: center; background: white; border-radius: 12px; padding: 32px; }
    img { width: 280px; height: 280px; display: block; margin: 24px auto 20px; image-rendering: pixelated; }
    .secret { font-family: monospace; font-size: 18px; word-break: break-all; user-select: all; }
    .uri { font-size: 12px; color: #64748B; overflow-wrap: anywhere; }
    .warning { margin-top: 20px; font-weight: 700; color: #B45309; }
  </style>
</head>
<body>
  <main>
    <h1>Configuración TOTP</h1>
    <img src="${dataUrl}" width="280" height="280" alt="Código QR TOTP">
    <p><strong>Secreto:</strong></p>
    <p class="secret">${MFA_SECRET}</p>
    <p class="uri">${scheme}</p>
    <p class="warning">Solo para la demostración</p>
  </main>
</body>
</html>`;
    res.type("html").status(200).send(html);
  } catch (error) {
    next(error);
  }
}
