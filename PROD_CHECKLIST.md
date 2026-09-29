# CALŌR — Production Readiness Checklist

Last updated: June 2026  
Status legend: `[ ]` Not done · `[x]` Done · `[~]` Partial / in progress · `[!]` Blocked

---

## 🔴 P0 — CRITICAL (Block launch if not resolved)

These are security issues or broken core flows. Ship nothing until these are green.

### Auth & Access Control

- [x] **Uncomment admin auth check in `src/app/admin/page.tsx`**
  - Fixed: `if (!session) redirect('/account')` is now active
  - Defence-in-depth: page + layout both check auth

- [x] **Protect Host Studio (`/host/*`)**
  - Fixed: `isHost Boolean @default(false)` and `isModerator Boolean @default(false)` added to Customer model
  - `layout.tsx` converted to server component, redirects non-admin/non-host users
  - `HostLayoutClient.tsx` created to hold client-side nav
  - Schema pushed to DB ✓

- [x] **Enforce email verification on login**
  - Fixed: Login route now returns `EMAIL_NOT_VERIFIED` (401) for unverified email-auth users
  - OAuth users (Google/Apple) are auto-considered verified
  - File: `src/app/api/auth/login/route.ts`

- [x] **Age gate enforcement on guest checkout**
  - Fixed: `checkout/page.tsx` checks `calor_age_verified` cookie server-side
  - Redirects to `/age-gate?returnTo=/checkout` if cookie is missing
  - Cannot be bypassed via direct URL navigation

- [ ] **CRON_SECRET must be set and validated**
  - All 4 cron routes exist but `CRON_SECRET` check must be in `.env.production`
  - Without it, anyone can trigger `/api/cron/abandoned-cart` publicly
  - Verify: `echo $CRON_SECRET` on server is non-empty
  - Files: `src/app/api/cron/*/route.ts`

- [ ] **Stripe webhook secret validation**
  - `STRIPE_WEBHOOK_SECRET` must be set to the production webhook secret (not test)
  - Verify the webhook endpoint at `dashboard.stripe.com` points to `https://yourdomain.com/api/stripe/webhook`
  - File: `src/app/api/stripe/webhook/route.ts`

- [ ] **JWT_SECRET must be production-grade**
  - Dev JWT secret is often weak/guessable
  - Generate: `openssl rand -base64 32`
  - Must be set in production environment, not shared with dev

### Core Flow Breakage

- [ ] **First admin user bootstrap**
  - There is no `/register-admin` page or CLI script
  - To create first admin: must seed via `create-test-users.ts` or direct DB UPDATE
  - Document this process and create a one-time bootstrap script
  - Suggested: `bun scripts/create-test-users.ts` sets `isAdmin: true` for `admin@calor.com`

---

## 🟡 P1 — IMPORTANT (Fix within first week of launch)

These are missing functionality that affects operations or user trust.

### Missing Admin UI Pages

- [ ] **Review approval queue** — `/admin/reviews`
  - Reviews require `isApproved: false` by default
  - Analytics shows `pendingReviews` count but there's no action page
  - Admin has no UI to approve, reject, or read reviews
  - Must build: list pending reviews, approve/reject buttons

- [ ] **Return request processing** — `/admin/returns`
  - Customers can submit return requests via `/returns`
  - Admin has no UI to view, approve, or process return requests
  - The `ReturnRequest` model exists with full status tracking
  - Must build: list all returns, update status, mark refunded

- [ ] **Blog post management** — `/admin/blog`
  - Blog posts exist in DB (`BlogPost`, `BlogAuthor`, `BlogCategory` models)
  - There is no admin UI to create, edit, publish, or delete blog posts
  - Currently only possible via seed scripts or direct DB
  - Must build: CRUD for blog posts, author management, category management

- [ ] **Promotions & flash sales management** — `/admin/promotions`
  - API exists at `/api/promotions` and `/api/flash-sales`
  - No admin UI to create/edit promo codes, set usage limits, manage flash sales
  - Must build: promo code creator, flash sale scheduler

- [ ] **Refund processing**
  - Admin can set order status to `REFUNDED` but no Stripe refund is actually triggered
  - Must wire: `POST /api/admin/orders/[id]/refund` → calls `stripe.refunds.create()`
  - File to create: `src/app/api/admin/orders/[id]/refund/route.ts`

- [ ] **Consultation management** — `/admin/consultations`
  - Consultants exist in DB, booking API exists
  - No admin UI to manage consultants, approve bookings, set availability
  - Must build: consultant CRUD, booking management

### Feature Flags System

- [x] **Add environment-based feature flags**
  - Done: `src/lib/features.ts` created with 8 flags driven by `NEXT_PUBLIC_FEATURE_*` env vars
  - Flags: `liveStreaming`, `arExperience`, `smartToys`, `consultations`, `wellness`, `giftRegistry`, `semanticSearch`, `cryptoPayments`
  - Default states match the feature flag plan table below

- [x] **Hide dev-only admin pages in production**
  - Done: `adminNavItems` in `AdminLayoutClient.tsx` uses `isDev` guard
  - `/admin/email-test`, `/admin/wellness-test`, `/admin/changelog` are hidden when `NODE_ENV === 'production'`

### Role & Permission Gaps

- [x] **Add `isHost` and `isModerator` booleans to Customer model**
  - Done: Both fields added to `prisma/schema.prisma` and pushed to DB
  - `/host/layout.tsx` now server component — checks `isAdmin || isHost`
  - Unauthorized users redirected to `/account`

- [x] **Email verification enforcement on login**
  - Done — see P0 above. Applied at the login route level.

---

## 🟢 P2 — IMPORTANT SOON (Fix within first month)

These don't block launch but affect operational efficiency.

### Missing Admin UI (Complete the Suite)

- [ ] **Category management** — `/admin/categories`
  - Can't add new product categories or change sort order from admin UI
  - Must build: list categories, edit name/description/icon/sortOrder, add/delete

- [ ] **Bundle management** — `/admin/bundles`
  - Bundle API exists at `/api/bundles`
  - No admin UI to create bundles, add products, set bundle price
  - Must build: bundle creator with product picker

- [ ] **VIP tier management** — `/admin/vip`
  - VIP tiers are seeded but can't be edited from admin UI
  - Must build: edit tier thresholds, benefits, names

- [ ] **Gift card oversight** — `/admin/gift-cards`
  - Can't see issued gift cards, check balances, revoke fraudulent cards
  - Must build: list all gift cards, show balance, usage history, ability to void

- [ ] **Subscription management** — `/admin/subscriptions`
  - Can't cancel, pause, or resume customer subscriptions from admin UI
  - Must build: list all active subscriptions, pause/cancel actions

- [ ] **Audit log viewer** — `/admin/audit-logs`
  - `AuditLog` model exists and is populated
  - No UI to view audit trail of admin actions
  - Must build: paginated audit log viewer with filters

### Customer-Facing Gaps

- [ ] **Order cancellation by customer**
  - Customers can't cancel pending orders themselves
  - Must build: cancel button on orders page for PENDING orders, trigger refund if paid

- [ ] **Subscription cancellation self-service**
  - No clear "cancel subscription" button in account UI
  - Stripe Customer Portal link exists but unclear UX

- [ ] **Digital product delivery**
  - Digital products are in the catalog but no download/access mechanism after purchase
  - Must build: `/account/digital` shows purchased digital products with download links

---

## ⚙️ INFRASTRUCTURE

### Environment Variables (All must be set in production)

**Required — App will not start without these:**
- [ ] `DATABASE_URL` — PostgreSQL (Neon) connection string
- [ ] `JWT_SECRET` — min 32 chars, production-generated
- [ ] `STRIPE_SECRET_KEY` — live key (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard webhook config
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — live key (`pk_live_...`)
- [ ] `RESEND_API_KEY` — for transactional emails
- [ ] `NEXT_PUBLIC_BASE_URL` — `https://yourdomain.com`

**Required — Revenue-impacting if missing:**
- [ ] `CRON_SECRET` — protects all `/api/cron/*` endpoints
- [ ] `COINBASE_COMMERCE_API_KEY` — crypto payments
- [ ] `COINBASE_WEBHOOK_SECRET` — crypto webhook verification

**Required — Features degrade if missing:**
- [ ] `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` + `NEXT_PUBLIC_LIVEKIT_URL` — live streaming
- [ ] `NEXT_PUBLIC_SUPPORT_CHAT_URL` — support chat mini-service URL
- [ ] `NEXT_PUBLIC_LIVE_STREAM_URL` — live stream mini-service URL
- [ ] `OPENEXCHANGERATES_APP_ID` — currency conversion

**Optional — Monitoring & OAuth:**
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — error monitoring
- [ ] `SENTRY_AUTH_TOKEN` — source maps
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — rate limiting
- [ ] `R2_ACCOUNT_ID` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_BUCKET_NAME` + `R2_PUBLIC_URL` — image uploads
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google OAuth
- [ ] `APPLE_CLIENT_ID` + `APPLE_TEAM_ID` + `APPLE_KEY_ID` + `APPLE_PRIVATE_KEY` — Apple OAuth

### Cron Jobs

- [ ] Configure vercel.json cron schedules:
  - `POST /api/cron/abandoned-cart` — every 6 hours
  - `POST /api/cron/price-alerts` — daily at 9am
  - `POST /api/cron/stock-alerts` — every 4 hours
  - `POST /api/cron/gift-cards` — daily at midnight
- [ ] Verify all cron endpoints require `Authorization: Bearer CRON_SECRET` header
- [ ] Test each cron manually with `curl -H "Authorization: Bearer $CRON_SECRET" POST /api/cron/...`

### Database

- [ ] Run `bunx prisma migrate deploy` (not `db push`) on production DB
- [ ] Run all seed scripts in order:
  1. `bun prisma/seed.ts` — categories, products
  2. `bun prisma/seed-knowledge.ts` — chatbot knowledge base
  3. `bun seed-phase5.ts` — VIP tiers, rewards
  4. `bun scripts/seed-wellness.ts` — achievements, challenges
  5. `bun scripts/create-test-users.ts` — admin + test customer
- [ ] Enable Neon point-in-time recovery (free tier has it)
- [ ] Verify database connection pooling is configured (pgbouncer URL for serverless)

### Mini-Services (VPS deployment)

- [ ] Support chat service running on port 3031: `docker ps | grep support-chat`
- [ ] Live stream service running on port 3032: `docker ps | grep live-stream`
- [ ] DNS records: `chat.yourdomain.com` → VPS IP (grey cloud — no Cloudflare proxy)
- [ ] DNS records: `stream.yourdomain.com` → VPS IP (grey cloud — no Cloudflare proxy)
- [ ] Caddy SSL working: `curl https://chat.yourdomain.com` returns 200/101

---

## 🧪 MANUAL SMOKE TESTS

Run these after each deployment. Fail = do not ship.

### Auth Flows
- [ ] Register new account → verification email arrives → click link → email verified ✓
- [ ] Login with email/password → redirects to `/account/orders`
- [ ] Login with wrong password 5 times → rate limited on 6th attempt
- [ ] Forgot password → email arrives → click link → reset password → can log in
- [ ] (If configured) Google OAuth login → creates account, sets session
- [ ] Session shows up in `/account/sessions` → can revoke it

### Shopping Flow
- [ ] Browse shop → add to cart → cart drawer opens with item
- [ ] Cart quantity update works
- [ ] Go to `/checkout` → fill form → payment page
- [ ] (Test mode) Complete Stripe payment with `4242 4242 4242 4242`
- [ ] Order confirmation email arrives within 2 minutes
- [ ] Order appears in `/account/orders`
- [ ] Stock deducted from product inventory

### Admin Flows
- [ ] Login as admin → `/admin` dashboard loads with real data
- [ ] Create a product → appears in shop
- [ ] Publish/unpublish a product → visible/hidden in shop
- [ ] Update order status → customer would see updated status
- [ ] View support ticket → reply → customer ticket shows reply
- [ ] Toggle another customer's `isAdmin` → they can/cannot access `/admin`

### Age Gate
- [ ] First visit → age gate appears
- [ ] Confirm age → cookie set → age gate doesn't reappear
- [ ] Guest attempting checkout without age gate cookie → redirected (P0 item)

### Payments
- [ ] Stripe webhook: trigger `payment_intent.succeeded` → order status updates
- [ ] Crypto charge: create coinbase charge → complete in sandbox → order confirmed
- [ ] Gift card: purchase → code emailed → apply at checkout → balance deducted

---

## 📊 MONITORING & OBSERVABILITY

- [ ] Sentry project created, DSN set, errors flowing to dashboard
- [ ] Verify error boundary renders on forced error (visit `/api/not-real`)
- [ ] Set up Sentry alert: notify on 5+ errors/minute
- [ ] Stripe webhook deliveries dashboard: all green (no failed deliveries)
- [ ] Vercel deployment notifications enabled (Slack/email on fail)
- [ ] Database connection health check: `GET /api/route.ts` returns 200

---

## 🚀 GO-LIVE SEQUENCE

Run in this exact order on launch day:

1. [ ] Confirm all P0 items resolved
2. [ ] Set all required env vars in Vercel
3. [ ] Run `bunx prisma migrate deploy` on production DB
4. [ ] Run all seed scripts
5. [ ] Deploy to Vercel (push to `main` branch)
6. [ ] Run smoke tests end-to-end
7. [ ] Verify Stripe webhooks delivering
8. [ ] Verify cron jobs scheduled in Vercel dashboard
9. [ ] Verify mini-services responding on subdomains
10. [ ] Enable Sentry and verify receiving events
11. [ ] Switch Stripe from test mode to live mode
12. [ ] Set custom domain DNS in Cloudflare
13. [ ] Verify SSL certificates provisioned
14. [ ] Announce

---

## 📋 ROLE SYSTEM — CURRENT STATE vs. RECOMMENDED

### Current (2 effective roles):
```
Guest → Customer (any email) → Admin (isAdmin: true)
```

### Recommended (5 roles):
```
Guest
  └── Customer (authenticated)
        ├── Verified Customer (emailVerified + ageVerified)
        ├── Host (isHost: true — can create live streams)
        ├── Staff (isModerator: true — can manage support tickets, not products)
        └── Admin (isAdmin: true — full access)
```

### Schema changes needed:
```prisma
model Customer {
  isAdmin      Boolean @default(false)
  isHost       Boolean @default(false)    // NEW
  isModerator  Boolean @default(false)    // NEW — support staff
}
```

---

## 🏁 FEATURE FLAG PLAN

Suggested initial state for production:

| Feature | Flag | Initial State | Notes |
|---------|------|---------------|-------|
| Live Streaming | `NEXT_PUBLIC_FEATURE_LIVE` | `false` | Enable after mini-services verified |
| AR/Virtual Try-On | `NEXT_PUBLIC_FEATURE_AR` | `false` | Experimental, no real AR backend |
| Smart Toys | `NEXT_PUBLIC_FEATURE_TOYS` | `false` | Requires hardware integration |
| Consultations | `NEXT_PUBLIC_FEATURE_CONSULTATIONS` | `true` | Build is complete |
| Wellness Platform | `NEXT_PUBLIC_FEATURE_WELLNESS` | `true` | Build is complete |
| Quiz → Cart | *(always on)* | `true` | Core feature |
| AI Search | *(always on)* | `true` | Build is complete |

---

*This checklist is a living document. Update it as items are resolved or new gaps are found.*
*Mark items `[x]` only after manual verification in production, not just in local/staging.*
