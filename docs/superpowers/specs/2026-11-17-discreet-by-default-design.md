# Discreet by default — design

Date: 2026-11-17 · Status: owner said "continue building" (opted out of further questions); calls marked *(call)* are mine.

## Why
Discretion is calo.'s product (vision: "every moment either earns trust or spends it"). An audit on 2026-11-17 found the site makes privacy promises the code does not keep. This slice makes every promise true or removes it. It is the first slice of the rebuild (product map §7.1).

## The discretion test (from the vision — the acceptance bar)
1. Nothing on a screen, notification, email subject, statement, parcel or shared link reveals what was bought or done unless the person chose to reveal it.
2. Nothing public carries a real name; people appear by a chosen nickname.
3. Private by default; sharing is deliberate.
4. Leaving is as easy as joining: export and delete really work.
5. Every promise the UI or legal pages make is true in the code.

## Audit findings this slice closes
| Finding | Fix |
|---|---|
| Packaging preference is saved but never reaches the order, admin or packer | Snapshot it onto the order at creation; show it in admin; neutral printable packing slip |
| "Sender shows as CC Fulfillment" — nothing prints it | Sender name comes from one setting (`SHIP_FROM_NAME`, default "CC Fulfillment"); every page that names it reads the setting *(call: keep the name, make it configurable, so it can match whoever ships)* |
| `/order/[reference]` shows items and full address to anyone with the link | Public view shows status, carrier/tracking and estimated delivery only; items and address only to the signed-in owner or an admin (`canAccessOrder`) |
| Email subjects "Price Drop: {product}", "Back in Stock: {product}"; abandoned-cart body lists items; gift-card subject names the sender | Neutral subjects ("Something on your list has changed", "A gift is waiting for you"); abandoned-cart shows an item count and a link, not names *(call)*; no product names in any subject or preheader |
| Order confirmation interpolates item names unescaped | Escape with `escapeHtml` |
| Reviews GET exposes `lastName`, `guestEmail` | Public reviews show the nickname (or first name + last initial until one is set); never email |
| Registry public API/page returns owner's full name | First name + last initial; title/OG metadata the same |
| Shared wishlist reads `lastName` that the API never selects | Use the same display-name helper |
| Live chat shows first names | Shows nickname; members choose one in account settings *(call: default nickname generated, e.g. "Amber 4821", until they choose)* |
| Support tickets show internal notes to customers | Customer endpoints filter `isInternal` messages and `internalNotes` |
| `/account/security`: delete, export, 2FA are fake | Real JSON data export; real account deletion (see below); 2FA toggle removed until real TOTP exists |
| FAQ "use a different billing name" | Removed (Stripe's descriptor is merchant-set) |
| Seed copy "Incognito mode", "private listening history" | Removed |
| "Statement shows CALO CO." for every payment method; "No product names … ever" | Reworded: card payments show **CALO CO**; bank and crypto payments explained separately; "we send only CALO CO; your bank decides the final layout" |
| No privacy receipt | New last step on checkout review: what the box, label sender, statement, email subject and tracking link will show, built from the same settings the system actually uses |

## Design decisions
- **One source of truth for discretion facts** — `src/lib/discretion.ts` exports the statement descriptor, ship-from name, neutral email subjects and a `publicDisplayName(person)` helper. The Stripe call, legal pages, privacy receipt, chatbot answers and emails all read from it, so a promise can't drift from behaviour.
- **Nickname** — `Customer.nickname` (unique, nullable). `publicDisplayName` returns nickname, else first name + last initial. Used by reviews, live chat (API and the realtime mini-service), registry, wishlist.
- **Order snapshot** — `Order.plainPackaging` (default true), `Order.discreetLabel` (default true), `Order.deliveryInstructions`, copied from `PackagingPreference` (or defaults for guests) inside the existing order transaction. Admin order view shows a "Plain box" badge and instructions; `/admin/orders/[id]/slip` renders a printable slip: order reference, quantities and SKUs, no product names, no calo. branding, return address = ship-from name.
- **Account deletion** — `DELETE /api/account` (signed-in, re-enter password or recent OAuth session): revokes all sessions, deletes addresses/alerts/wishlist/packaging prefs, anonymises the customer row (email → `deleted+{id}@invalid`, names → "Deleted", nickname null, OAuth ids null, passwordHash null); orders are kept for tax with the link to the anonymised row. Refused while an order is unpaid-pending or in progress *(call: refuse with a clear message rather than cancel orders)*.
- **Data export** — `GET /api/account/export`: JSON of profile, addresses, orders (items, totals), reviews, wishlist, preferences. Never other people's data; no internal notes.
- **Stripe** — confirm `statement_descriptor` is valid for card PaymentIntents on the installed API version; if Stripe requires `statement_descriptor_suffix` for cards, switch so the statement still reads CALO CO.

## Non-goals
Payment-processor switching (separate slice, pending Stripe approval), real 2FA, fulfilment-company integration, private-stream passwords, account pre-hijack fixes (separate security slice), the monorepo move (this logic lands in `src/lib/` as pure modules so it moves unchanged).

## Anti-goals
- A promise shown in the UI that the code doesn't keep.
- Discretion that costs safety: deletion must not orphan payments or break tax records.

## Done when
Every row above is fixed and covered by a test; a grep for product-name interpolation in email subjects finds none; the privacy receipt renders from `src/lib/discretion.ts`; an account can be exported and deleted end to end.
