# CALŌR — Bugs & Fixes Tracker

> Generated: 2026-06-15  
> Deep audit of all source files, API routes, auth flows, config, stores, and components.  
> Check off items as they are fixed.

---

## Legend
- 🔴 **Critical** — Launch blocker. Will cause silent failures or user-facing errors in production.
- 🟠 **High** — Data integrity issue or broken feature that severely degrades experience.
- 🟡 **Medium** — Functional but incorrect behavior, edge case risk, or tech debt.

---

## 🔴 CRITICAL — Fix Before Launch

### [x] 1. OAuth buttons point to wrong URLs — 404 on click
**File:** `src/app/account/AccountClient.tsx` — Lines 57, 62  
**Problem:**  
```ts
window.location.href = '/api/auth/google'  // ← 404
window.location.href = '/api/auth/apple'   // ← 404
```
The actual OAuth routes are `/api/auth/oauth/google` and `/api/auth/oauth/apple`.  
Clicking "Sign in with Google" or "Sign in with Apple" hits a 404 — social login is completely broken on the frontend despite the backend being fully implemented.  
**Fix:** Change both href paths to include `/oauth/`:
```ts
window.location.href = '/api/auth/oauth/google'
window.location.href = '/api/auth/oauth/apple'
```
**Effort:** ~5 minutes

---

### [x] 2. Guest card checkout is broken — `create-intent` requires a session
**Files:**  
- `src/app/api/payment/create-intent/route.ts` — Lines 8–11  
- `src/app/checkout/payment/page.tsx` — Line 206  

**Problem:**  
The payment page always sends `isGuest: true` when creating an order. But `create-intent` immediately checks for an authenticated session and returns `401` if none exists:
```ts
// payment/page.tsx
isGuest: true, // For now, treating all as guest checkout

// create-intent/route.ts
const session = await getSession()
if (!session?.customerId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```
A guest user will create an order → call `create-intent` → get 401 → never receive a Stripe `clientSecret` → never see the Stripe Elements form. **Guest card checkout is completely broken.**  
**Fix:** Remove the session requirement from `create-intent`, or look up the order by `orderId` and verify ownership via `guestEmail` match.  
**Effort:** ~1 hour

---

### [ ] 3. Guest order address creation will throw — `customerId: null!`
> **Status 2026-10-01:** Still open. The non-null assertion was replaced by a type cast, which hides the error from the compiler but not from Prisma. Fixed by `docs/superpowers/plans/2026-10-01-checkout-order-integrity.md`.
**File:** `src/app/api/orders/route.ts` — Lines 101–113  
**Problem:**  
For guest orders, `customerId` is `null`. The address creation uses a non-null assertion (`!`), passing `null` as a required foreign key:
```ts
address = await db.address.create({
  data: {
    customerId: customerId!,  // ← null for guests — Prisma error
    ...
  },
})
```
If `Address.customerId` is a required field in the Prisma schema, this throws and the entire guest order creation fails.  
**Fix:** Make `customerId` optional in the `Address` schema (if not already), and pass `customerId: customerId ?? undefined`.  
**Effort:** ~15 minutes

---

### [x] 4. Apple OAuth leaks client secret to the frontend
**File:** `src/app/api/auth/oauth/apple/route.ts` — Lines 141–144  
**Problem:**  
The Apple `clientSecret` (a signed JWT derived from your `APPLE_PRIVATE_KEY`) is returned to the client in the JSON response:
```ts
const response = NextResponse.json({
  url: authUrl.toString(),
  clientSecret   // ← your private key material returned to browser
})
```
The client secret is sensitive — it should never leave the server.  
**Fix:** Return only `{ url: authUrl.toString() }`. The `clientSecret` is used server-side when exchanging the code, not needed on the client.  
**Effort:** ~5 minutes

---

### [x] 5. Debug `console.log` leaks session data in admin page
**File:** `src/app/admin/page.tsx` — Line 8  
**Problem:**  
```ts
console.log(session, "SESSIon")
```
This logs the full session object (email, customerId) to the server console on every admin page load. Must be removed before production.  
**Fix:** Delete line 8.  
**Effort:** ~1 minute

---

### [ ] 6. `vercel.json` doesn't exist — cron jobs will never run on Vercel
> **Status 2026-10-01:** Not applicable. Cron jobs run from the VPS crontab (`scripts/setup-crontab.sh`), not Vercel Cron.
**File:** `vercel.json` — missing  
**Problem:**  
The `LAUNCH_CHECKLIST.md` instructs creating a `vercel.json` with cron config. Without it, all 4 scheduled jobs never fire:
- Abandoned cart recovery (every 6 hours)
- Price drop alerts (daily)
- Stock alerts (every 4 hours)
- Gift card delivery (daily)

**Fix:** Create `vercel.json` at the project root:
```json
{
  "crons": [
    { "path": "/api/cron/abandoned-cart", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/price-alerts", "schedule": "0 9 * * *" },
    { "path": "/api/cron/stock-alerts", "schedule": "0 */4 * * *" },
    { "path": "/api/cron/gift-cards", "schedule": "0 0 * * *" }
  ]
}
```
**Effort:** ~5 minutes

---

### [x] 7. Cron secret header is inconsistent — 3 different patterns
**Problem:**  
Three different auth mechanisms are used across the codebase for cron security:

| File | Header | Var name |
|---|---|---|
| `api/cron/abandoned-cart/route.ts` L12 | `Authorization: Bearer ${...}` | `CRON_SECRET` |
| `api/cron/stock-alerts/route.ts` L12 | `X-Cron-Secret: ${...}` | `CRON_SECRET` |
| `DEPLOYMENT.md` L556 | `X-Cron-Key: ...` | `CRON_SECRET_KEY` |
| `LAUNCH_CHECKLIST.md` L319 | `Authorization: Bearer CRON_SECRET` | `CRON_SECRET` |

In production, depending on what you set, only one or none of the cron jobs would pass auth.  
**Fix:** Standardize all cron endpoints to use `Authorization: Bearer ${process.env.CRON_SECRET}` and update all docs to match. Use one env var: `CRON_SECRET`.  
**Effort:** ~30 minutes

---

## 🟠 HIGH — Data / Logic Issues

### [x] 8. Abandoned cart cron handler uses `GET` but Vercel cron sends `GET` — method inconsistency with other crons
**File:** `src/app/api/cron/abandoned-cart/route.ts` — Line 8  
**Problem:**  
```ts
export async function GET(request: NextRequest) {
```
All other cron handlers use `POST` (e.g. `stock-alerts`). The `LAUNCH_CHECKLIST.md` cron config also implies POST-based calls. The abandoned cart handler exports `GET`, making it inconsistent and potentially bypassing cron auth if not matched properly.  
**Fix:** Change `GET` to `POST` to match the other cron handlers and update the `vercel.json` accordingly.  
**Effort:** ~5 minutes

---

### [x] 9. Admin dashboard always shows `$0` revenue
**File:** `src/app/admin/page.tsx` — Line 44  
**Problem:**  
```ts
revenue: 0, // Would calculate from orders
```
The main admin stats card is hardcoded. The analytics API (`/api/admin/analytics`) correctly aggregates revenue, but the admin dashboard's `page.tsx` never calls it.  
**Fix:** Either query revenue directly in `admin/page.tsx` using:
```ts
const revenueData = await db.order.aggregate({
  where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
  _sum: { totalCents: true }
})
```
Or redirect stats fetching to use the analytics API.  
**Effort:** ~30 minutes

---

### [x] 10. Sessions revoke button comparison logic is broken
**File:** `src/app/account/sessions/page.tsx` — Line 88  
**Problem:**  
```ts
{s.token !== session.customerId && (
  <RevokeSessionButton sessionId={s.id} />
)}
```
`s.token` is a 400+ character JWT string. `session.customerId` is a UUID. These will never be equal — so the Revoke button appears on **every** session including the current active one. Revoking your own current session would log you out mid-page.  
**Fix:** Track the current session token by reading the cookie, then compare `s.token !== currentToken`. Or add a `isCurrent` flag server-side.  
**Effort:** ~15 minutes

---

### [x] 11. `salesByDay` raw SQL is SQLite-specific — breaks on PostgreSQL
**File:** `src/app/api/admin/analytics/route.ts` — Lines 150–161  
**Problem:**  
```sql
SELECT date(createdAt) as date, ...
FROM "Order"
WHERE createdAt >= datetime('now', '-30 days')
```
`date()` and `datetime('now', '-30 days')` are **SQLite** functions. The production setup uses **PostgreSQL** (via Neon). This query will throw a PostgreSQL error in production.  
**Fix:** Replace with PostgreSQL-compatible syntax:
```sql
SELECT DATE("createdAt") as date, ...
FROM "Order"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
```
Or use a Prisma `groupBy` query instead to stay DB-agnostic.  
**Effort:** ~30 minutes

---

## 🟡 MEDIUM — Code Quality / Polish

### [x] 12. `text-mid-gray` Tailwind class is undefined — PENDING badge has invisible text
**File:** `src/app/account/orders/page.tsx` — Line 33  
**Problem:**  
```ts
PENDING: 'bg-sand text-mid-gray',
```
`mid-gray` is not defined in `tailwind.config.ts`. The PENDING order status badge renders with missing text color.  
**Fix:** Replace `text-mid-gray` with `text-warm-gray`.  
**Effort:** ~1 minute

---

### [x] 13. Loyalty points slider max has a ×100 unit error
**File:** `src/app/checkout/CheckoutClient.tsx` — Lines 599–606  
**Problem:**  
```ts
max={Math.min(
  availablePoints,
  (subtotal + shipping + wrappingCost - promoDiscount) * 100,
)}
```
`subtotal` is already in **cents** (e.g. 5000 = $50). Multiplying by 100 again means a $50 order allows a slider max of 500,000 points. The conversion should be direct (1 point = 1 cent = $0.01). The server-side cap will catch it but the UI is wrong and confusing.  
**Fix:** Remove the `* 100` — the slider max should be `Math.min(availablePoints, subtotal + shipping + wrappingCost - promoDiscount)`.  
**Effort:** ~15 minutes

---

### [x] 14. `adminApiHandler` returns 401 instead of 403 for non-admin users
**File:** `src/lib/admin/middleware.ts` — Line 29  
**Problem:**  
```ts
return NextResponse.json({ error: auth.error }, { status: 401 })
```
When an authenticated (but non-admin) user calls an admin API, they receive `401 Unauthorized` instead of `403 Forbidden`. This is semantically incorrect and may cause frontend auth handlers to incorrectly redirect the user to login.  
**Fix:** Return `status: 403` when the user is authenticated but lacks admin access.  
**Effort:** ~5 minutes

---

### [ ] 15. R2 custom domain not whitelisted in `next.config.ts`
> **Status 2026-10-01:** Still open by design — add the hostname to `remotePatterns` once the R2 custom domain exists.
**File:** `next.config.ts` — Lines 10–14  
**Problem:**  
```ts
{ protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
```
The `LAUNCH_CHECKLIST.md` instructs setting up a custom domain for R2 (e.g. `assets.calorco.com`). Any custom domain will cause Next.js `<Image>` components to fail with "hostname not configured in next.config".  
**Fix:** After configuring the R2 custom domain, add it to `remotePatterns` in `next.config.ts`:
```ts
{ protocol: "https", hostname: "assets.yourdomain.com" },
```
**Effort:** ~5 minutes (at deploy time when domain is known)

---

### [ ] 16. Apple OAuth always uses `keys[0]` without matching `kid` — fragile key rotation
> **Status 2026-10-01:** Partly fixed (matches by `kid`, but still falls back to `keys[0]`). Finished by `docs/superpowers/plans/2026-10-01-repo-hygiene.md` Task 5.
**File:** `src/app/api/auth/oauth/apple/route.ts` — Line 165  
**Problem:**  
```ts
const key = data.keys[0] // Use the first key
```
Apple returns multiple public keys and rotates them periodically. Always using `keys[0]` without matching the JWT's `kid` (Key ID) header will break verification when Apple rotates keys.  
**Fix:** Match the Apple key by `kid`:
```ts
const jwtHeader = JSON.parse(Buffer.from(idToken.split('.')[0], 'base64').toString())
const key = data.keys.find((k: any) => k.kid === jwtHeader.kid)
if (!key) throw new Error('No matching Apple public key found')
```
**Effort:** ~30 minutes

---

### [x] 17. `COINBASE_COMMERCE_API_KEY` and `COINBASE_WEBHOOK_SECRET` are hard-required in config
**File:** `src/lib/config.ts` — Lines 2–21  
**Problem:**  
```ts
const required = [
  ...
  'COINBASE_COMMERCE_API_KEY',
  'COINBASE_WEBHOOK_SECRET',
  ...
]
```
These are listed as hard-required — the entire app throws and refuses to start if they are missing. Crypto payments are optional; operators who only want Stripe should be able to run the app without Coinbase credentials.  
**Fix:** Move Coinbase vars to optional config:
```ts
coinbase: {
  apiKey: process.env.COINBASE_COMMERCE_API_KEY || null,
  webhookSecret: process.env.COINBASE_WEBHOOK_SECRET || null,
},
```
And conditionally show the "Pay with Crypto" option on the payment page only when `coinbase.apiKey` is configured.  
**Effort:** ~15 minutes

---

## ✅ Confirmed Clean — No Action Needed

| Area | Status |
|---|---|
| Auth session (JWT, httpOnly cookie, DB verification) | ✅ Solid |
| Admin layout route guard — checks `isAdmin` from DB | ✅ Solid |
| Order creation transaction (atomicity, inventory deduction) | ✅ Solid |
| Stripe webhook signature verification | ✅ Solid |
| Login timing-attack prevention (dummy hash) | ✅ Solid |
| Rate limiting (Redis with in-memory fallback) | ✅ Solid |
| Google OAuth CSRF state cookie validation | ✅ Solid |
| Apple OAuth CSRF state cookie validation | ✅ Solid |
| Checkout: PII stored server-side, only UUID in sessionStorage | ✅ Solid |
| Password validation (uppercase, lowercase, number, special char) | ✅ Solid |
| Email verification flow | ✅ Solid |
| Password reset flow | ✅ Solid |
| Admin API middleware — checks `isAdmin` per-request | ✅ Solid |
| Promo code and gift card deduction (in DB transaction) | ✅ Solid |
| Loyalty points deduction (in DB transaction) | ✅ Solid |
| Stock deduction on order creation | ✅ Solid |
| Order confirmation email triggered post-order | ✅ Solid |
| Security alert emails on login and registration | ✅ Solid |
| Footer links — all legal pages exist | ✅ Solid |
| Admin pages (products, orders, customers) — exist and functional | ✅ Solid |

---

## Fix Order Recommendation

```
Day 1 — Critical (all small):
  ✅ #5  Remove console.log (1 min)
  ✅ #1  Fix OAuth button URLs (5 min)
  ✅ #4  Remove Apple clientSecret from response (5 min)
  ✅ #6  Create vercel.json with cron config (5 min)
  ✅ #8  Fix abandoned-cart cron GET→POST (5 min)
  ✅ #12 Fix text-mid-gray class (1 min)
  ✅ #14 Fix 401→403 in adminApiHandler (5 min)
  ✅ #3  Fix guest address customerId null assertion (15 min)
  ✅ #7  Standardize cron secret headers (30 min)
  ✅ #9  Wire up real revenue to admin dashboard (30 min)

Day 2 — High/Medium:
  ✅ #2  Fix guest card checkout (create-intent auth) (1 hr)
  ✅ #11 Fix salesByDay SQLite→PostgreSQL query (30 min)
  ✅ #10 Fix sessions revoke button comparison (15 min)
  ✅ #13 Fix loyalty slider max unit error (15 min)
  ✅ #17 Make Coinbase vars optional (15 min)
  ✅ #16 Fix Apple key selection by kid (30 min)
  ✅ #15 Add R2 custom domain to next.config.ts (at deploy time)
```

---

*Last updated: 2026-10-01*
