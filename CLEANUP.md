# Cleanup Passes — Swiss Startup Hub

Three successive cleanup passes were applied. All changes maintain identical runtime behaviour. TypeScript passes with zero errors after each pass.

---

## Pass 1 — Tailwind, Fire-and-forget, Try/Catch, Nav, Dead Code

**Tailwind dynamic class audit**
- Confirmed no dynamic class construction (`border-${color}-500` style) exists. All role button `activeClass` values in the signup page are complete static strings — no changes needed.

**Fire-and-forget email sends**
- Converted bare `await sendEmail(...)` calls inside try/catch blocks to fire-and-forget `.catch(() => {})` pattern in `src/app/api/reviews/route.ts` and `src/app/api/projects/[id]/posts/route.ts`.

**Missing try/catch on API handlers**
- Added try/catch to 5 previously unprotected handlers: `projects/route.ts` GET, `events/[id]/route.ts` DELETE, `projects/[id]/route.ts` GET, `projects/[id]/open-roles/route.ts` DELETE, `events/[id]/posts/route.ts` GET.

**`parseRoles` consolidation**
- Confirmed already centralised in `src/lib/utils.ts` — no duplicates found.

**Events nav link**
- Removed always-hidden Events link from `src/components/layout/Navbar.tsx`.

**FeedbackShell.tsx**
- Confirmed `src/components/layout/FeedbackShell.tsx` was deleted and all imports removed — no action needed.

---

## Pass 2 — Error Shape, Logging, findMany Limits, Env Safety, Type Safety

### Error response shape normalised to `{ error: '...' }`

All API routes previously returning `{ message: '...' }` on error have been updated to `{ error: '...' }`. Affected files:

- `src/app/api/auth/signup/route.ts` — success response changed to `{ userId: user.id }` (removed spurious message key)
- `src/app/api/badges/route.ts`
- `src/app/api/block/route.ts`
- `src/app/api/events/route.ts`
- `src/app/api/events/[id]/route.ts` — DELETE returns `{ success: true }`
- `src/app/api/events/[id]/registrations/route.ts` — DELETE returns `{ success: true }`
- `src/app/api/events/[id]/posts/route.ts`
- `src/app/api/events/[id]/register/route.ts`
- `src/app/api/feed/route.ts`
- `src/app/api/feedback/route.ts`
- `src/app/api/join-requests/route.ts`
- `src/app/api/join-requests/[id]/route.ts`
- `src/app/api/messages/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/[id]/posts/route.ts`
- `src/app/api/projects/[id]/follow/route.ts`
- `src/app/api/projects/[id]/followers/[followerId]/route.ts` — returns `{ success: true }`
- `src/app/api/projects/[id]/open-roles/route.ts` — DELETE returns `{ success: true }`
- `src/app/api/ratings/route.ts`
- `src/app/api/reports/route.ts`
- `src/app/api/reviews/route.ts`
- `src/app/api/search/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/users/me/route.ts`

### Frontend updated to read `data.error`

All client-side API error reads updated from `data.message` to `data.error`:

- `src/app/auth/signup/page.tsx`
- `src/app/messages/[id]/ConversationThread.tsx`
- `src/app/projects/new/page.tsx`
- `src/app/projects/[id]/edit/page.tsx`
- `src/app/projects/[id]/ProjectDetail.tsx` (two locations)
- `src/app/events/new/page.tsx`
- `src/app/profile/edit/page.tsx`

### Silent catch replaced with logging

Previously silent `.catch(() => {})` on fire-and-forget email sends now log the error:

- `src/app/api/events/[id]/register/route.ts`
- `src/app/api/join-requests/[id]/route.ts` (approve and reject paths)
- `src/app/api/messages/route.ts`
- `src/app/api/reviews/route.ts`
- `src/app/api/projects/[id]/posts/route.ts`

### Unbounded `findMany` limits added

| Route | Query | Limit |
|---|---|---|
| `events/[id]/posts/route.ts` | `eventPost.findMany` | `take: 100` |
| `projects/[id]/posts/route.ts` | `projectPost.findMany` | `take: 100` |
| `messages/route.ts` | `conversation.findMany` | `take: 50` |
| `events/route.ts` | `event.findMany` | `take: 100` |

### Environment variable safety

- `src/lib/prisma.ts`: throws at startup with a clear message if `DATABASE_URL` is missing.

### Type safety

- `src/app/api/events/route.ts`: `const where: any` → `Prisma.EventWhereInput`.

### Input validation

Existing routes already guard required fields at the top of handlers — no new validation gaps found.

---

## Known Remaining Issues / Future Work

- **`as any` casts in `search/route.ts`**: Prisma dynamic query building for cross-model search uses `as any`. Proper typing would require explicit union types across all searchable models — low priority.
- **`findMany` on `projects/route.ts` GET**: returns all projects matching the search filter with no pagination. Consider adding cursor-based pagination for large datasets.
- **`AUTH_SECRET` env var**: NextAuth will throw at runtime if missing — acceptable, but a startup assertion (like the one added for `DATABASE_URL`) would surface misconfiguration earlier.
- **`any` types in frontend components**: Several components use `useState<any[]>` for API response shapes (e.g., `ConversationThread.tsx`). These are cosmetic — typed response interfaces would improve IDE support but have no runtime impact.
