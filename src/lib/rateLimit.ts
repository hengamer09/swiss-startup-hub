interface RateEntry { count: number; resetAt: number; }
const store = new Map<string, RateEntry>();
let sweepCounter = 0;

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  // Sweep old entries occasionally
  if (++sweepCounter > 1000) {
    sweepCounter = 0;
    for (const [k, e] of store.entries()) {
      if (now > e.resetAt) store.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
