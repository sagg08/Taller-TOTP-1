# Backend Auth

Backend Express 5 + TypeScript para OAuth/PKCE, TOTP, JWT, refresh rotativo y bóveda protegida.

## Requisitos

- Node.js 24 o superior
- npm

## Ejecutar

Desde este directorio:

```powershell
copy .env.example .env
npm install
npm run dev
```

El servidor escucha en `0.0.0.0:4200` y usa variables de `.env`.

## Credenciales y QR

- Usuario demo: `demo`
- Contraseña demo: `demo`
- Secret TOTP demo: `JBSWY3DPEHPK3PXP`
- QR: `http://localhost:4200/dev/qr`
- Desde otro dispositivo reemplaza `localhost` por la IP LAN del equipo.

## Scripts

```powershell
npm run dev
npm run build
npm start
npm test
npm run smoke
```

Para el smoke test, inicia primero el servidor con `npm run dev`.
