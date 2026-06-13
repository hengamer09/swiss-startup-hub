// Server-only — lightweight security event logging + in-memory 24h counters.
// Without an external SIEM, these logs (grep "[SECURITY]" in Vercel logs) and
// the counters surfaced on the admin dashboard help detect abuse.
import { logger } from "@/lib/logger";

export type SecurityEventType =
  | "failed_login"
  | "idor_attempt"
  | "admin_unauthorized"
  | "rate_limit_abuse"
  | "bad_upload"
  | "disposable_email"
  | "auth_required";

interface CounterEntry {
  count: number;
  resetAt: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const counters = new Map<SecurityEventType, CounterEntry>();

function bump(type: SecurityEventType) {
  const now = Date.now();
  const entry = counters.get(type);
  if (!entry || now > entry.resetAt) {
    counters.set(type, { count: 1, resetAt: now + DAY_MS });
  } else {
    entry.count++;
  }
}

/** Logs a security-relevant event (warn level, `[SECURITY]` prefix) and counts it. */
export function logSecurityEvent(type: SecurityEventType, details: Record<string, unknown> = {}) {
  bump(type);
  logger.warn(`[SECURITY] ${type}`, details);
}

/** Returns the rolling 24h count for each tracked security event type. */
export function getSecurityCounts(): Record<string, number> {
  const now = Date.now();
  const out: Record<string, number> = {};
  for (const [type, entry] of counters.entries()) {
    out[type] = now > entry.resetAt ? 0 : entry.count;
  }
  return out;
}

/** Masks an email for safe logging: `henri@example.com` -> `h***@example.com`. */
export function maskEmail(email: string): string {
  const [local, domain] = String(email).split("@");
  if (!domain) return "***";
  const head = local.slice(0, 1) || "*";
  return `${head}***@${domain}`;
}
