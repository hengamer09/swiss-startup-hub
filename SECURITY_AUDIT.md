# Security Audit — Swiss Startup Hub

- **Date:** 2026-06-13
- **Auditor:** Claude Code
- **Scope:** Full hack-prevention, data-protection, cost-protection, backup, legal, dependency and monitoring review of the entire `src/app/api` surface and supporting libraries.

Legend: ✅ PASS · ⚠️ WARNING (acceptable, documented) · ❌ FAIL (found and **fixed** this pass)

---

## Part 1 — Hack Prevention

### 1.1 Authentication
- ✅ Every API route reading/writing user data calls `getServerSession`. Public-by-design routes: `auth/*` (signup/verify/resend — token & rate-limit protected), `contact` & `feedback` (public forms, rate-limited), `search` (public discovery, no private fields), `unsubscribe` (signed-token), `cron/*` (CRON_SECRET bearer).
- ✅ Unverified users (`emailVerified === false`) cannot log in — blocked in `auth.ts` `authorize` (`throw EMAIL_NOT_VERIFIED`). Because the app uses JWT sessions, no session is ever issued to an unverified user, so all session-gated API routes are also closed to them.
- ✅ Session cookies: `httpOnly`, `sameSite: lax`, `secure` in production. ❌→✅ Made explicit in `auth.ts` `cookies.sessionToken` (was relying on NextAuth defaults).
- ❌→✅ **AUTH_SECRET strength**: now logs `[SECURITY] AUTH_SECRET is shorter than 32 characters` at startup (`auth.ts`).

### 1.2 Authorization / IDOR
Audited every `[id]` route. All verify the caller owns/participates in the resource:
- ✅ Private messages — `messages/[id]` requires `participants: { some: { userId } }`; group chats inaccessible to non-members.
- ✅ Project delete/edit/stage — `projects/[id]` checks `ownerId === session.user.id`.
- ✅ Profile edit — `users/me` only ever acts on `session.user.id`.
- ✅ Remove team member — `projects/[id]/members/[memberId]` requires project owner (or self-removal).
- ✅ Admin newsletter / digest / reminders / stats / subscriber-count — all gated to `swissstartuphub@gmail.com` (403 otherwise).
- ✅ Data export & account delete — operate only on the requesting user.
- ✅ Pin/unpin — `conversations/[id]/pin` verifies the user is a participant.
- ✅ Event reminders / weekly digest — admin-only (POST) or CRON_SECRET (cron).
- No IDOR bypasses found.

### 1.3 Input validation
- ✅ All POST/PUT routes destructure only known fields (no mass-assignment), apply `stripTags`, and enforce length caps (names 100, descriptions 2000, messages 5000, URLs 500).
- ❌→✅ **URL fields** (`portfolioUrl/websiteUrl/githubUrl/linkedinUrl`, join-request `links`) now pass through `sanitizeUrl()` which only permits `http(s)://` — blocks `javascript:`/`data:` URLs.
- ❌→✅ **File uploads**: added 5 MB size cap (413), MIME whitelist (`jpeg/png/webp/gif`), **magic-byte sniffing** (rejects a `.exe`/`.html` renamed to `.png`), and a per-user 10-image storage cap.

### 1.4 Rate limiting
- ❌→✅ Signup tightened to **3/hour per IP** (was 10/min).
- ✅ Login 10/min, resend-verification 1/5min per user, upload **10/min per user**, newsletter **1/hour** (added), join-request & message 10–20/min, reads 60/min.
- ✅ Limiter keys on IP/user — cannot be bypassed via headers/user-agent.
- ⚠️ In-memory limiter resets on redeploy and is per serverless instance (no shared state). Documented; mitigate with Upstash Redis at scale.

### 1.5 Injection
- ✅ Zero `$queryRaw`/`$executeRaw` in application code (only the one-time `scripts/cleanup-orphans.ts`, static SQL, no user input). All queries via Prisma ORM.
- ✅ No `eval`, `new Function`, or `innerHTML` with user content. Newsletter preview uses an isolated sandboxed `<iframe srcDoc>`.
- ✅ Email templates HTML-escape all user content via `escapeHtml`.
- ✅ `stripTags` + trim removes `\r\n`, preventing email header injection.

### 1.6 Session security
- ❌→✅ Session `maxAge` set explicitly to **30 days** (`auth.ts`).
- ✅ Logout invalidates the JWT client-side (NextAuth). Sensitive actions require a valid session (checked server-side, not just cookie presence).
- ✅ Session token never returned in any API response or URL.

### 1.7 HTTP security headers (`next.config.ts`)
- ✅ `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, restrictive `Content-Security-Policy`.
- ❌→✅ Added `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-DNS-Prefetch-Control: off`, `X-Permitted-Cross-Domain-Policies: none`.
- ⚠️ CSP keeps `unsafe-inline`/`unsafe-eval` — required by Next.js hydration. Known limitation; tighten with nonces in future.

### 1.8 CSRF
- ✅ NextAuth CSRF tokens active for auth. State changes only via POST/PUT/DELETE (never GET). Session cookie is `sameSite: lax`, blocking cross-site form posts.

### 1.9 Error handling
- ✅ Every catch returns a generic `{ error: "..." }` and logs the real error with `logger.error`. No stack traces, Prisma error objects, or schema details reach the client.

---

## Part 2 — Customer Data Protection

### 2.1 Passwords
- ✅ bcrypt, 12 salt rounds (signup) — exceeds the 10 minimum.
- ✅ `passwordHash` excluded everywhere: `users/me` GET/PUT use `omit`, search uses `omit: { passwordHash, email }`, export strips it, signup `select: { id }`. Auth `authorize` reads it only to `bcrypt.compare`.
- ✅ Passwords never logged. Min length 8 enforced frontend + backend.

### 2.2 Personal data exposure
- ✅ Emails never exposed to other users (search omits `email`; public profile selects only public fields).
- ✅ IDs are `cuid`. Export & message APIs scope to the requester/participants only.

### 2.3 Data deletion
- ❌→✅ **Account deletion rewritten** (`users/me` DELETE) into a full transaction covering: ConversationPins, messages, conversation participants, **leftover/broken conversations**, bookmarks, ratings, blocks, reports, **authored project/event posts**, join requests, event attendees, **EmailSubscription** (previously left behind via SetNull), owned projects **+ their group chats**, organized events, then the user. Best-effort **Blob profile-image deletion** added. No "Unknown"/null references remain.

### 2.4 Encryption & transport
- ✅ DB over SSL (Neon `sslmode=require`). Brevo SMTP and Vercel Blob over HTTPS.
- ✅ Verification & unsubscribe tokens use `crypto.randomUUID()` / HMAC. Verification token has 24h expiry and is cleared on use (single-use). Unsubscribe token is a signed, stateless HMAC.
- ✅ Verification link uses a query token (standard for email verification, single-use + expiring). Unsubscribe likewise. No long-lived secrets in URLs.

### 2.5 GDPR / nDSG
- ✅ Privacy policy lists all collected data (❌→✅ added bookmarks, ratings, email-subscription preference). Rights (access/rectify/erase/portability/object) all functional. Cookie consent banner present. Only strictly necessary session cookie used. 30-day response window stated.

---

## Part 3 — Cost Protection

### 3.1 Query limits
- ❌→✅ Added `take` caps to the remaining unbounded `findMany` calls: `bookmarks` (100), `block` (200), export `conversations` (200) + nested messages (1000), project-followers notification fan-out (1000). All list endpoints paginate (≤20–100).

### 3.2/3.3 Email cost protection
- ❌→✅ Hard daily cap of **250 automated emails** per rolling 24h window (`email.ts`) — refuses and logs beyond that.
- ❌→✅ Newsletter capped at **500 per send**; >500 subscribers returns a warning to send the rest manually.
- ✅ Batches of 10 with 1s delay. Every send logged with masked recipient (`h***@domain`), type, timestamp.

### 3.4 Blob storage
- ❌→✅ Upload: 5 MB cap, MIME whitelist + magic-byte check, 10/min per user, **10 images per user** total cap. Each upload logged (user, size, type).

### 3.5 DB size monitoring
- ❌→✅ `GET /api/admin/backup-stats` returns row counts for all major tables and **warns when any exceeds 10,000 rows**. See scaling notes below.

---

## Part 4 — Backup

- ✅ Neon automatic point-in-time recovery (7-day retention on free tier). Documented restore procedure in `CLEANUP.md` → Backup & Recovery.
- ❌→✅ `GET /api/admin/backup-stats` endpoint created + surfaced on the Dashboard (admin only) via `BackupStats.tsx`.
- ✅ Code backed up on GitHub. ⚠️ Recommend enabling branch protection on `master`.

---

## Part 5 — Legal

- ✅ `/impressum`, `/privacy`, `/terms`, `/contact` exist, are complete, and linked in the footer site-wide.
- ✅ Terms acceptance + 18+ confirmation enforced frontend **and** backend; `acceptedTerms`/`confirmedAge` saved with timestamps.
- ✅ Unsubscribe link in every newsletter/notification email; works end-to-end.
- ❌→✅ Privacy policy now names all four processors — **Vercel** (hosting + Blob, Frankfurt/EU), **Neon** (DB, EU), **Brevo** (email, EU), **GitHub** (code, USA) — each noted as having its own policy. (Previously listed "Neon/Supabase" and omitted Brevo & GitHub.)
- ✅ 30-day data-request response window stated in the privacy policy.

---

## Part 6 — Dependency Security

- ❌→✅ `npm audit fix` upgraded **esbuild 0.28.0 → 0.28.1**, resolving the only **HIGH** (esbuild dev-server arbitrary file read / registry RCE — a transitive dep of the `tsx` devDependency, dev-time only).
- **Result: 0 high / 0 critical.** 8 moderate remain, all transitive and only fixable via breaking major downgrades:
  - ⚠️ `postcss` (via `next`) — fix would downgrade Next 16→9. Build-time only.
  - ⚠️ `uuid <11.1.1` (via `next-auth`) — fix would downgrade next-auth to v3. Unused v3/v5/v6 buffer path.
  - ⚠️ remaining `esbuild` moderate items (via `tsx`) — dev toolchain only, never in the production runtime.
- ✅ Current security-relevant versions: next 16.2.7, next-auth 4.24.x, @prisma/client & prisma 7.8.0, bcryptjs 3.0.3, @vercel/blob 2.4.0, nodemailer 7.0.7.
- ✅ `package-lock.json` committed and updated. All deps from the public npm registry.

---

## Part 7 — Monitoring & Suspicious Activity

- ❌→✅ Created `src/lib/securityLog.ts` — `logSecurityEvent(type, details)` logs `[SECURITY] <type>` at warn level and keeps rolling 24h counters surfaced on the admin dashboard.
- ✅ Wired in: disposable-email signup attempts, bad/forged file uploads, unauthorized admin access (`newsletter`, `backup-stats`). Failed logins already logged in `auth.ts`.
- ❌→✅ **Disposable email blocking** on signup (`isDisposableEmail` — guerrillamail, mailinator, yopmail, tempmail, etc.) → `{ error: "Please use a permanent email address" }`.
- ❌→✅ Admin dashboard shows security counts (failed logins, IDOR attempts, admin-denied, rate-limit hits, pending reports), new signups 24h, and unverified accounts older than 7 days.

---

## Part 8 — Additional Hardening

- ✅ All email sends are fire-and-forget with `.catch`/internal try-catch — a failed email never crashes a request. SMTP fallback-sender retry verified. Per-conversation 1/5min email throttle intact.
- ✅ Error responses consistently `{ error: "..." }`.
- ✅ Frontend shows friendly error messages and loading states; upload handlers surface the real API error.
- ❌→✅ `env.ts` now exposes `NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL`; `.env.example` documents every variable incl. `NEXTAUTH_URL` and `CRON_SECRET`. Required vars (`DATABASE_URL`, `AUTH_SECRET`) throw clear errors if missing.

---

## Summary

| Category | Checks | ✅ Pass | ⚠️ Warning | ❌ Fixed |
|---|---|---|---|---|
| 1 Hack prevention | 9 | 4 | 2 | 6 |
| 2 Data protection | 5 | 4 | 0 | 3 |
| 3 Cost protection | 5 | 1 | 0 | 5 |
| 4 Backup | 3 | 2 | 1 | 1 |
| 5 Legal | 4 | 3 | 0 | 1 |
| 6 Dependencies | 3 | 2 | 3 | 1 |
| 7 Monitoring | 3 | 0 | 0 | 4 |
| 8 Hardening | 4 | 3 | 0 | 1 |

**Totals:** ~36 checks · 19 pass · 6 documented warnings · **22 issues fixed**. **0 high/critical npm vulnerabilities.**

### Known remaining risks (all accepted/mitigated)
1. In-memory rate limiting & counters — no cross-instance state; reset on deploy. Mitigation: Upstash Redis at scale.
2. CSP `unsafe-inline`/`unsafe-eval` — required by Next.js.
3. 8 moderate transitive npm advisories — only fixable via breaking downgrades; none in the production runtime path.
4. Daily email cap is per-instance in-memory — a true global cap needs a shared store (Redis) at scale.

### Recommendations when scaling
- **Upstash Redis** for shared rate limiting, email counters, and security counters.
- **Sentry** (`@sentry/nextjs`) for error monitoring and alerting.
- **Vercel Pro** + **Neon Pro** (30-day PITR) for headroom and longer backup retention.
- **GitHub branch protection** on `master`.
- Persist security events to a table (or log drain) for historical analysis beyond 24h.
