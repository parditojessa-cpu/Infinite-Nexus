import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";

function requiredSecret(envVar: string, devFallback: string): string {
  const value = process.env[envVar];
  if (value) return value;
  if (isProd) throw new Error(`${envVar} must be set in production`);
  return devFallback;
}

const ACCESS_SECRET = requiredSecret("JWT_ACCESS_SECRET", "dev-access-secret-change-me");
const REFRESH_SECRET = requiredSecret("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me");

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
