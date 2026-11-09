import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const algorithm = "HS512" as const;

export function signToken(payload: object, ttlSeconds: number, secret: string): string {
  const options: SignOptions = { algorithm, expiresIn: ttlSeconds };
  return jwt.sign(payload, secret, options);
}

export function verifyToken<T extends object>(token: string, secret: string): T & JwtPayload {
  return jwt.verify(token, secret, { algorithms: [algorithm] }) as T & JwtPayload;
}
