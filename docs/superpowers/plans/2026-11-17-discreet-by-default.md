# Discreet by Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every discretion promise calo. makes true in the code, or remove it.

**Architecture:** One pure module, `src/lib/discretion.ts`, holds every discretion fact (statement descriptor, ship-from name, neutral email subjects, public display names). Routes, emails, pages and the checkout privacy receipt read from it so promises can't drift from behaviour. Small schema additions (nickname, order packaging snapshot) in one migration.

**Tech Stack:** Next.js 16 App Router, Prisma 6 / Postgres, Vitest 4 (`// @vitest-environment node` for route tests; DB mocked with `vi.hoisted` + `vi.mock('@/lib/db')` as in `src/__tests__/api/data-exposure.test.ts`), Bun, Tailwind 4, Socket.IO mini-service `mini-services/live-stream/index.ts`.

**Spec:** `docs/superpowers/specs/2026-11-17-discreet-by-default-design.md`

## Global Constraints
- Card statement descriptor text: `CALO CO` (no trailing period). Copy says "Card payments show CALO CO".
- Ship-from name: `process.env.SHIP_FROM_NAME || 'CC Fulfillment'`.
- No product name, brand name of a product, or category may appear in any email subject or preheader.
- Public display name = `nickname` if set, else `firstName` + space + first letter of `lastName` + `.` (e.g. "Ada L."); if no last name, first name alone; never email, never full last name.
- Default nickname format when generating: a word from a fixed warm list + space + 4 digits (e.g. "Amber 4821"); must be unique; regenerate on collision (max 5 tries).
- Nickname rules when user-chosen: 3–24 chars, letters/digits/space/`_`/`-`, trimmed, case-insensitive unique, must not contain `@`.
- House style for any UI (locked): warm-white/cream/sand, Cormorant Garamond light headings with one italic terracotta word, DM Sans body, square corners, charcoal uppercase buttons; small terracotta text uses `#A35A3F`.
- No `Co-Authored-By` or any attribution trailer in commits.
- Never run a command against the remote database in `.env`; migrations are generated with `prisma migrate dev --create-only` against a throwaway Docker Postgres, or written by hand and checked with `prisma migrate diff`.
- Every existing test keeps passing (`bunx vitest run`), `bunx tsc --noEmit` clean, `bun run lint` 0 errors.

## Review Focus
1. Guest orders: the packaging snapshot uses defaults (plain box on) when there is no customer/preference; the order page shows a guest only the public view.
2. Deleting an account with an order in `PENDING`/`PAYMENT_RECEIVED`/`PROCESSING`/`SHIPPED` is refused with 409 and changes nothing.
3. A nickname that differs only in case from an existing one is rejected (409).
4. Ticket messages endpoint called by the ticket's customer never returns `isInternal: true` messages; admin still sees them.
5. A customer with an empty `lastName` renders as first name only, not "Ada ." (pinned in Task 1 tests).

---

### Task 1: Discretion module, schema and migration

**Files:**
- Create: `src/lib/discretion.ts`
- Modify: `prisma/schema.prisma` (Customer, Order)
- Create: `prisma/migrations/<timestamp>_discreet_by_default/migration.sql`
- Test: `src/__tests__/discretion/discretion.test.ts`

**Interfaces — Produces:**
- `STATEMENT_DESCRIPTOR = 'CALO CO'`
- `shipFromName(): string`
- `EMAIL_SUBJECTS: { priceDrop: string; backInStock: string; abandonedCart: string; giftCard: string; orderConfirmed: string; shipped: string }` with values: priceDrop `"Something on your list has changed"`, backInStock `"Something on your list is available again"`, abandonedCart `"You left something in your bag"`, giftCard `"A gift is waiting for you"`, orderConfirmed `"Your order is confirmed"`, shipped `"Your order is on its way"`.
- `publicDisplayName(p: { nickname?: string | null; firstName?: string | null; lastName?: string | null } | null | undefined, fallback = 'Guest'): string`
- `validateNickname(raw: unknown): { ok: true; value: string } | { ok: false; error: string }`
- `generateNickname(random?: () => number): string`
- Schema: `Customer.nickname String? @unique`; `Order.plainPackaging Boolean @default(true)`, `Order.discreetLabel Boolean @default(true)`, `Order.deliveryInstructions String?`. Case-insensitive uniqueness is enforced in code (Task 5) by storing nickname as typed and checking with `mode: 'insensitive'`; the migration also adds `CREATE UNIQUE INDEX "Customer_nickname_lower_key" ON "Customer" (lower("nickname"));`.

- [ ] Step 1: Write tests: `publicDisplayName({nickname:'Amber 4821', firstName:'Ada', lastName:'Lovelace'}) === 'Amber 4821'`; `({firstName:'Ada', lastName:'Lovelace'}) === 'Ada L.'`; `({firstName:'Ada', lastName:''}) === 'Ada'`; `(null) === 'Guest'`; `(null,'Anonymous') === 'Anonymous'`; `validateNickname('  ab ')` fails; `validateNickname('a@b.com')` fails; `validateNickname('Night_Owl-7')` ok with value `'Night_Owl-7'`; `generateNickname(() => 0)` matches `/^[A-Z][a-z]+ \d{4}$/`; no `EMAIL_SUBJECTS` value contains a `$` or `{`; `shipFromName()` returns `'CC Fulfillment'` when env unset and the env value when set.
- [ ] Step 2: Run `bunx vitest run src/__tests__/discretion` — FAIL.
- [ ] Step 3: Implement module; edit schema; write migration SQL; verify with `bunx prisma validate` and `bunx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url <throwaway docker url> --script` prints only the lower() index or nothing; run `bunx prisma generate`.
- [ ] Step 4: Tests pass; `bunx tsc --noEmit` clean.
- [ ] Step 5: Commit `feat(discretion): one module for discretion facts, nickname and order packaging columns`.

### Task 2: Neutral emails

**Files:** Modify `src/lib/email/index.ts`, `src/app/api/anonymous-gift/route.ts`. Test: `src/__tests__/email/discretion-subjects.test.ts`.

**Interfaces — Consumes:** `EMAIL_SUBJECTS`, `STATEMENT_DESCRIPTOR` from Task 1.

- [ ] Step 1: Tests (mock `resend`, capture `emails.send` args; set required env): `sendPriceDropAlert({...productName:'Wand X'})` subject equals `EMAIL_SUBJECTS.priceDrop` and does not contain `'Wand X'`; same for `sendBackInStockAlert`; `sendAbandonedCartEmail` html contains `"2 items"` for two items and contains no item name; `sendGiftCardEmail` subject is `EMAIL_SUBJECTS.giftCard` and doesn't contain the sender name; `sendOrderConfirmation` with item name `<b>x</b>` renders `&lt;b&gt;x&lt;/b&gt;`; every subject passed to `send` across all exported senders matches no name from the fixture data.
- [ ] Step 2: Run — FAIL.
- [ ] Step 3: Implement. Abandoned-cart body: item count ("1 item"/"N items"), total, and the recovery link — no names or images. Statement copy in emails reads `Card payments show ${STATEMENT_DESCRIPTOR}`. Anonymous gift email: keep the `gifts@calo.one` address, set the display name to `"Gift notification"`; body says the sender chose to stay anonymous; drop "plain, unmarked… no brand visible" claim unless `order.plainPackaging` (pass it in).
- [ ] Step 4: Pass; full email test folder green.
- [ ] Step 5: Commit `fix(email): neutral subjects, no item names in reminders, escape item names`.

### Task 3: Packaging reaches the order, admin and packer

**Files:** Modify `src/app/api/orders/route.ts` (inside the existing transaction, before `tx.order.create`), `src/app/admin/orders/AdminOrdersClient.tsx` and the admin orders API it calls (include the new fields). Create `src/app/admin/orders/[id]/slip/page.tsx`. Test: extend `src/__tests__/checkout/order-route.test.ts`; create `src/__tests__/api/packing-slip.test.ts` if the page logic is extracted to `src/lib/orders/packing-slip.ts`.

**Interfaces — Produces:** `buildPackingSlip(order: { reference: string; plainPackaging: boolean; discreetLabel: boolean; deliveryInstructions: string | null; items: { quantity: number; variant?: { sku?: string | null } | null; productId: string }[] }): { reference: string; lines: { sku: string; quantity: number }[]; plainPackaging: boolean; returnName: string; instructions: string | null }` in `src/lib/orders/packing-slip.ts` (sku falls back to the first 8 chars of productId uppercased).

- [ ] Step 1: Tests: order for a customer whose `packagingPreference` is `{plainPackaging:false, discreteLabel:true, deliveryInstructions:'Leave with concierge'}` creates the order with those three values (note the prisma field is `discreteLabel` on the preference, `discreetLabel` on the order); guest order gets `plainPackaging:true, discreetLabel:true, deliveryInstructions:null`; `buildPackingSlip` output has no product name key anywhere (`JSON.stringify` excludes the fixture's product name) and `returnName === shipFromName()`.
- [ ] Step 2: FAIL.
- [ ] Step 3: Implement. Admin list/detail shows a "Plain box" or "Branded box" badge and instructions, and a "Packing slip" link. Slip page: `requireAdminUser`-equivalent server check (redirect non-admins), print-friendly, house style but no calo. wordmark; shows reference, SKU × qty, return name, instructions.
- [ ] Step 4: Pass.
- [ ] Step 5: Commit `feat(orders): packaging choice travels with the order to admin and a neutral packing slip`.

### Task 4: Order tracking link shows only status to strangers

**Files:** Modify `src/app/order/[reference]/page.tsx`; extract `getOrderView(reference: string, viewer: { customerId: string | null; isAdmin: boolean })` into `src/lib/orders/order-view.ts`. Test `src/__tests__/api/order-view.test.ts`.

**Interfaces — Produces:** `getOrderView(...) : Promise<null | { reference; status; trackingNumber; estimatedDelivery; createdAt; full: null | { items: {name; quantity; priceCents}[]; address: {...}; totalCents; currency } }>`. `full` is set only when `canAccessOrder(order, {customerId})` or `isAdmin`.

- [ ] Step 1: Tests: anonymous viewer gets `full === null` and the returned object's JSON contains no item name or address line; owner gets `full`; another signed-in customer gets `full === null`; admin gets `full`; unknown reference → `null`. Query must `select` only status fields when not entitled (assert on the mocked `findUnique` args or on output).
- [ ] Step 2: FAIL.
- [ ] Step 3: Implement; page shows status steps + tracking for everyone and, when `full` is null, a line "Sign in to see what's inside and where it's going." with a link to `/account/login?redirect=/order/{reference}`.
- [ ] Step 4: Pass.
- [ ] Step 5: Commit `fix(orders): tracking link shows status only unless you own the order`.

### Task 5: Members choose a nickname

**Files:** Create `src/app/api/account/nickname/route.ts` (GET, PUT). Modify the account settings/profile page (find under `src/app/account/`; add a "Your nickname" field). Modify registration (`src/app/api/auth/register/route.ts`) and OAuth account creation to set `nickname: await uniqueGeneratedNickname()`. Create helper `uniqueGeneratedNickname(): Promise<string>` in `src/lib/nickname.ts` (uses `generateNickname`, checks `findFirst({ where: { nickname: { equals, mode: 'insensitive' } } })`, max 5 tries then append a 6th random digit). Test `src/__tests__/api/nickname.test.ts`.

- [ ] Step 1: Tests: PUT unauthenticated → 401; invalid nickname → 400 with the validator's error; nickname taken case-insensitively by someone else → 409; own current nickname in different case → 200; success updates and returns `{ nickname }`; GET returns current; new registration creates a customer with a nickname matching the generated format.
- [ ] Step 2: FAIL. Step 3: Implement (UI copy: eyebrow "Privacy", heading "How *others* see you", helper "Shown in live chat, reviews and shared lists. Never your real name."). Step 4: Pass.
- [ ] Step 5: Commit `feat(account): members choose the nickname others see`.

### Task 6: Real names never reach public surfaces

**Files:** Modify `src/app/api/reviews/route.ts` (GET and the POST response select), `src/app/api/registry/slug/[slug]/route.ts`, `src/app/registry/[slug]/page.tsx`, `src/app/wishlist/[code]/page.tsx`, `src/app/api/wishlist/shared/route.ts`, the shared wishlist client, `src/app/api/streams/[id]/chat/route.ts`, `mini-services/live-stream/index.ts` (select `nickname, firstName, lastName` and emit `publicDisplayName`; the mini-service cannot import from `src/` — copy the function into `mini-services/live-stream/display-name.ts` with a comment naming the source of truth and a test asserting both implementations agree on the Task 1 cases). Also any review list UI that composed names client-side. Tests: extend `src/__tests__/api/data-exposure.test.ts`; add `src/__tests__/realtime/display-name-parity.test.ts`.

- [ ] Step 1: Tests: reviews GET response JSON contains no `lastName`, `guestEmail`, or email-like string and shows `publicDisplayName`; registry slug API `ownerName` is `'Ada L.'` for Ada Lovelace (or nickname); chat GET `displayName` is the nickname when set; the registry/wishlist metadata builder (extract `registryMetadata`/`wishlistMetadata` if needed) uses the display name; guest reviews use `guestName`'s first word only, never `guestEmail`.
- [ ] Step 2: FAIL. Step 3: Implement. Step 4: Pass; `cd mini-services && bun build` or the existing compile step still succeeds (`bun run build` in the mini-service if defined).
- [ ] Step 5: Commit `fix(privacy): public pages show nicknames, never real names or emails`.

### Task 7: Staff-only ticket content stays with staff

**Files:** Modify `src/app/api/tickets/[id]/route.ts` (GET), `src/app/api/tickets/[id]/messages/route.ts` (GET if present, and POST: a non-admin can never set `isInternal`), `src/app/api/tickets/route.ts` (list). Test `src/__tests__/api/ticket-privacy.test.ts`.

- [ ] Step 1: Tests: customer GET of own ticket → messages filtered `isInternal: false` (assert query `where` or output) and response has no `internalNotes`; admin GET → internal messages and notes present; customer POST with `isInternal: true` stores `false`; customer GET of another customer's ticket → 404.
- [ ] Step 2: FAIL. Step 3: Implement. Step 4: Pass.
- [ ] Step 5: Commit `fix(support): customers never see internal notes`.

### Task 8: Export and delete really work

**Files:** Create `src/app/api/account/export/route.ts` (GET), `src/app/api/account/route.ts` (DELETE), `src/lib/account/delete-account.ts` (`deleteAccount(customerId: string, tx)`), `src/lib/account/export-account.ts` (`exportAccount(customerId: string): Promise<object>`). Modify `src/app/account/security/page.tsx`: wire Export (downloads `calo-data-{date}.json`) and Delete (confirmation dialog, password field for email accounts); remove the 2FA toggle and any copy promising it. Test `src/__tests__/api/account-lifecycle.test.ts`.

- [ ] Step 1: Tests: export unauthenticated → 401; export contains profile (no `passwordHash`, tokens, `stripeCustomerId`), addresses, orders with items, reviews, wishlist, preferences; header `Content-Disposition: attachment`. DELETE: unauthenticated → 401; email account with wrong password → 403 and nothing changed; customer with an order in any of `PENDING, PAYMENT_RECEIVED, PROCESSING, SHIPPED` → 409 "You have an order in progress…" and nothing changed; success runs in one `db.$transaction`: deletes sessions, addresses not referenced by orders (referenced ones get their name/phone/lines replaced with `'Deleted'` except country), alerts, wishlist(s), packaging preference, couple links; updates customer to `email: 'deleted+{id}@invalid'`, `firstName: 'Deleted'`, `lastName: ''`, `nickname: null`, `passwordHash: null`, `googleId/appleId/googleEmail/appleEmail: null`, `emailVerified: false`; clears the session cookie; returns 200. OAuth-only account (no passwordHash) may delete without password.
- [ ] Step 2: FAIL. Step 3: Implement (find every relation on `Customer` in the schema and decide delete vs anonymise; list the decision per model in a comment at the top of `delete-account.ts`). Step 4: Pass.
- [ ] Step 5: Commit `feat(account): real data export and account deletion; remove the fake 2FA toggle`.

### Task 9: Promises match the code

**Files:** `src/lib/payments/stripe.ts`, `src/app/legal/discreet-billing/page.tsx`, `src/app/legal/privacy/page.tsx`, `src/app/legal/cookies/page.tsx`, `src/app/our-story/page.tsx`, `src/components/home/PaymentTrust.tsx`, `src/components/cart/CartDrawer.tsx`, `src/app/checkout/CheckoutClient.tsx:815`, `src/app/product/[slug]/ProductDetailClient.tsx:1091`, `src/app/gift-cards/GiftCardsClient.tsx:385`, `src/app/api/chatbot/route.ts` (discretion answers), `prisma/seed.ts:361,382`. Test `src/__tests__/discretion/promises.test.ts`.

- [ ] Step 1: Tests: the Stripe PaymentIntent create args use the card-valid descriptor field (see Step 3) whose value is `STATEMENT_DESCRIPTOR`; a source scan test reads the listed files and asserts: no `"CALO CO."` (with period), no `billing name`/`different name` FAQ, no `Incognito`, no "No product names or descriptions are ever visible", and every literal `CC Fulfillment` outside `src/lib/discretion.ts` is gone (pages render `shipFromName()`).
- [ ] Step 2: FAIL.
- [ ] Step 3: Implement. Check the installed `stripe` package's types/changelog for whether `statement_descriptor` is accepted on card PaymentIntents in the pinned API version; if card payments require `statement_descriptor_suffix`, use that (with the account-level descriptor set to `CALO CO` — add this to the deploy notes in the PR) and record the finding in a code comment. Copy: "Card payments show **CALO CO** on your statement. Your bank decides the exact layout." Bank transfer: "Bank transfers go to an account named [account name from the bank instructions email]." Crypto: "Crypto payments show no card statement line." Remove the billing-name FAQ entry and seed incognito/private-history bullets. Chatbot answers reuse these strings from `src/lib/discretion.ts` (add `DISCRETION_COPY` export there).
- [ ] Step 4: Pass.
- [ ] Step 5: Commit `fix(copy): every discretion promise matches what the code does`.

### Task 10: Privacy receipt before payment

**Files:** Create `src/components/checkout/PrivacyReceipt.tsx`; modify `src/app/checkout/CheckoutClient.tsx` to show it on the final review step above the pay button, fed by the selected payment method, the customer's packaging preference (fetch `/api/packaging` when signed in; defaults for guests) and whether it's an anonymous gift. Test `src/__tests__/checkout/privacy-receipt.test.tsx` (jsdom, Testing Library if present in devDependencies; otherwise render with `react-dom/server` `renderToStaticMarkup`).

**Interfaces — Consumes:** `STATEMENT_DESCRIPTOR`, `shipFromName`, `EMAIL_SUBJECTS`, `DISCRETION_COPY`.

- [ ] Step 1: Tests: card + plain packaging renders rows "The box — Plain, no logo", "The label — From {shipFromName()}", "Your statement — CALO CO", "Email subject — Your order is confirmed", "Tracking link — Shows delivery status only"; branded packaging renders "The box — calo. box"; crypto renders "Your statement — No card statement line"; anonymous gift adds "The recipient — Won't see your name". Heading text "Only *you* will know." with the italic word in an `<em>`.
- [ ] Step 2: FAIL. Step 3: Implement in the house style (eyebrow "Before you pay", Cormorant heading, 1 px sand rules between rows, square corners, labels DM Sans 0.7rem uppercase 0.25em tracking in `#A35A3F`). Step 4: Pass.
- [ ] Step 5: Commit `feat(checkout): privacy receipt shows exactly what others will see`.
