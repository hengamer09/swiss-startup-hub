// Server-only — generates and verifies signed unsubscribe tokens.
// A token is `base64url(email).hmac` so the unsubscribe page only needs the token.
import crypto from "crypto";
import { env } from "@/lib/env";

function sign(data: string): string {
  return crypto.createHmac("sha256", env.AUTH_SECRET).update(data).digest("base64url");
}

export function makeUnsubscribeToken(email: string): string {
  const data = Buffer.from(email.toLowerCase().trim()).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function parseUnsubscribeToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(data);
  // Constant-time comparison
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    return Buffer.from(data, "base64url").toString("utf8");
  } catch {
    return null;
  }
}
