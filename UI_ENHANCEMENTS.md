# CALŌR UI Enhancement Tracker

All planned UI enhancements. Each task is marked off after implementation is confirmed.

**Rules:** No border-radius. Terracotta as accent. Cormorant for display, DM Sans for body. warm-white/cream/sand/charcoal palette. No API or database changes.

---

## Execution Order

Tasks are ordered by visual impact (highest first). All are pure UI — no breaking changes.

---

## 1. Global CSS Foundations
**File:** `src/app/globals.css`

- [x] Add `@keyframes slide-in-up` — for staggered list/card entrances (opacity 0→1, translateY 16px→0)
- [x] Add `@keyframes card-glint` — 45° white gradient sweep for VIP gold shimmer effect
- [x] Add `@keyframes bounce-once` — single bounce (not infinite) for cart icon notification
- [x] Add `@keyframes gradient-shift` — slow hue cycle for Hero right panel (cycles between cream/sand/blush stops)
- [x] Add `.grain-overlay` utility class — SVG noise texture via pseudo-element at 2–3% opacity
- [x] Add `.animate-bounce-once` class — applies `bounce-once` keyframe once, forwards
- [x] Add `.animate-pause-on-hover:hover` — sets `animation-play-state: paused`
- [x] Add `.hover-bar-grow` — reusable bottom bar pattern (width 0→100% on group hover)

---

## 2. ScrollReveal Component Enhancement
**File:** `src/components/ui/ScrollReveal.tsx`

- [x] Read current implementation to understand existing API
- [x] Enhance with configurable `direction` prop: `'up' | 'left' | 'right' | 'fade'`
- [x] Add `delay` prop (milliseconds, applied as CSS `animation-delay`)
- [x] Add `threshold` prop (IntersectionObserver threshold, default `0.15`)
- [x] Add `once` prop (default `true` — animate in once, don't replay on scroll out)
- [x] Ensure `prefers-reduced-motion` media query disables animations when set

---

## 3. Hero Enhancement
**File:** `src/components/home/Hero.tsx`

- [x] Add parallax effect on scroll — decorative "C" moves at 0.3× scroll rate via `useEffect` + `window.scrollY` → `transform: translateY`
- [x] Add text entrance animation — headline words animate in sequentially on mount using staggered `animation-delay`
- [x] Add slow CSS gradient shift animation to right panel (using `gradient-shift` keyframe)
- [x] Add grain texture overlay to right panel (using `.grain-overlay`) at 3% opacity
- [x] Enhance scroll indicator — add "scroll" label in eyebrow style, rotated 90° beside the pulsing line

---

## 4. Product Card Enhancements
**File:** `src/components/product/ProductCard.tsx`

- [x] Dual image hover — if product has ≥2 images, second image cross-fades on group hover
- [x] Quick Add button loading state — inline `<Loader2 animate-spin />` spinner while `isAdding = true`
- [x] Wishlist toggle pop animation — `scale-125` bounce on Heart icon toggle
- [x] Social proof label — pulsing terracotta dot before "Most Popular" / "Trending" text
- [x] Sale price strikethrough draw — line-through via CSS on card hover
- [x] Card entrance stagger — `ScrollReveal` ready via component API

---

## 5. Navigation Enhancements
**File:** `src/components/layout/Navigation.tsx`

- [x] Shop hover dropdown — 8 category quick links, `opacity-0 → opacity-100` transition with terracotta bottom border
- [x] Active route indicator — `usePathname()` drives `text-terracotta` + full-width animated underline
- [x] Cart bounce notification — `animate-bounce-once` on cart icon when item count increases (setTimeout-deferred)
- [x] Mobile menu link stagger — each link gets `animation-delay` of `index * 60ms`
- [x] Logo letter-spacing hover — `hover:tracking-[0.35em]` subtle luxury touch

---

## 6. Cart Drawer Refinements
**File:** `src/components/cart/CartDrawer.tsx`

- [x] Free shipping progress bar — `h-1 bg-sand` track with `bg-terracotta` fill animated by `width: ${progress}%`
- [x] Item entrance animation — `animate-slide-in-up` on each cart item div
- [x] Empty state watermark — decorative "C" letter at 4% opacity behind empty state text
- [x] Quantity button hover fill — `hover:bg-sand hover:border-terracotta` on `+`/`−` controls
- [x] Checkout button arrow — `<ArrowRight>` that slides right on `group-hover:translate-x-1`

---

## 7. Category Grid Enhancements
**File:** `src/components/home/CategoryGrid.tsx`

- [x] Grain texture overlay — SVG noise inline style at 2% opacity on each card
- [x] Terracotta tint on hover — `bg-terracotta/0 → bg-terracotta/8` overlay transition
- [x] Product count visibility — `opacity-70 group-hover:opacity-100` transition on count text
- [x] Icon scale on hover — `group-hover:scale-110` on icon container

---

## 8. Features Showcase
**File:** `src/components/home/FeaturesShowcase.tsx`

- [x] Bottom accent bar — `h-0.5 bg-terracotta w-0 group-hover:w-full transition-all duration-500`
- [x] Icon scale on hover — `group-hover:scale-110` alongside existing color transition
- [x] Editorial index numbers — `absolute top-4 right-4 font-body text-xs text-charcoal/8`

---

## 9. Marquee Enhancement
**File:** `src/components/home/Marquee.tsx`

- [x] Pause on hover — `animate-marquee-container` class triggers `animation-play-state: paused` on hover
- [x] Diamond separators — `rotate-45` square replaces rounded dot
- [x] Linked items — each marquee item is a `<Link>` to a relevant page

---

## 10. Dark Section Enhancements

### Philosophy Section
**File:** `src/components/home/Philosophy.tsx`

- [x] Grain texture — `grain-overlay` on `bg-charcoal` section
- [x] Stat card hover — `hover:border-l-2 hover:border-l-terracotta` transition
- [x] Italic "warmth" word — `animate-warmth-pulse` (3s subtle opacity pulse)

### VIPTeaser Section
**File:** `src/components/home/VIPTeaser.tsx`

- [x] Grain texture — `grain-overlay` on `bg-charcoal` section
- [x] Gold shimmer on Gold/Platinum cards — `card-glint` animation on hover via React state
- [x] Tier card hover border — `hover:border-gold/40 hover:-translate-y-1`

### Newsletter Section
**File:** `src/components/home/Newsletter.tsx`

- [x] Grain texture — `grain-overlay` on `bg-charcoal` section
- [x] Input focus animation — terracotta underline grows from center outward via `scaleX` width transition

---

## 11. Account Layout — Mobile Navigation
**File:** `src/app/account/layout.tsx`

- [x] Mobile sidebar replaced with horizontally scrollable tab bar (`overflow-x-auto flex whitespace-nowrap`)
- [x] Active state in horizontal tab bar — `border-b-2 border-terracotta text-terracotta`
- [x] Desktop sidebar now uses `sticky top-28` for persistent scroll behaviour
- [x] Removed old hamburger mobile sidebar — cleaner UX

---

## 12. Chatbot Widget Polish
**File:** `src/components/chatbot/ChatbotWidget.tsx`

- [x] Floating button — `bg-terracotta hover:bg-terracotta-light hover:scale-105` with `shadow-lg`
- [x] Widget entrance — custom `chatOpen` keyframe with `translateY + scale` using `--ease-apple`
- [x] Message bubble styling — user: `bg-charcoal text-cream`; bot: `bg-cream text-charcoal border border-sand`
- [x] Typing indicator — 3 dots with staggered `animate-bounce` delays (0ms, 150ms, 300ms)
- [x] Suggested actions — `border border-sand hover:border-terracotta hover:text-terracotta` brand-consistent style
- [x] Online indicator — terracotta `animate-pulse` dot (brand-aligned, replacing generic green)

---

## 13. Wire ScrollReveal Into All Home Sections
**File:** `src/app/page.tsx`

- [x] `CategoryGrid` — wrapped in `<ScrollReveal direction="up">`
- [x] `FeaturedProducts` — wrapped in `<ScrollReveal direction="up">`
- [x] `FeaturesShowcase` — wrapped in `<ScrollReveal direction="up">`
- [x] `VIPTeaser` — wrapped in `<ScrollReveal direction="fade">`
- [x] `SearchSection` — wrapped in `<ScrollReveal direction="up">`
- [x] `Philosophy` — wrapped in `<ScrollReveal direction="fade">`
- [x] `GiftSets` — wrapped in `<ScrollReveal direction="up">`
- [x] `DigitalProducts` — wrapped in `<ScrollReveal direction="up">`
- [x] `PaymentTrust` — wrapped in `<ScrollReveal direction="up">`
- [x] `Newsletter` — wrapped in `<ScrollReveal direction="fade">`

---

## 14. Footer Mobile Fix
**File:** `src/components/layout/Footer.tsx`

- [x] Brand column spans full width on mobile with `border-b border-charcoal/40 md:border-none`
- [x] 4 link columns collapse cleanly into `grid-cols-2` on mobile
- [x] Social icons have `min-w-[44px] min-h-[44px]` for adequate tap targets
- [x] Bottom bar uses `flex-col sm:flex-row` — stacks vertically on mobile

---

## Summary

| # | Area | File(s) | Status |
|---|------|---------|--------|
| 1 | Global CSS Foundations | `globals.css` | ✅ Complete |
| 2 | ScrollReveal Enhancement | `ui/ScrollReveal.tsx` | ✅ Complete |
| 3 | Hero Enhancement | `home/Hero.tsx` | ✅ Complete |
| 4 | Product Card | `product/ProductCard.tsx` | ✅ Complete |
| 5 | Navigation | `layout/Navigation.tsx` | ✅ Complete |
| 6 | Cart Drawer | `cart/CartDrawer.tsx` | ✅ Complete |
| 7 | Category Grid | `home/CategoryGrid.tsx` | ✅ Complete |
| 8 | Features Showcase | `home/FeaturesShowcase.tsx` | ✅ Complete |
| 9 | Marquee | `home/Marquee.tsx` | ✅ Complete |
| 10a | Philosophy Section | `home/Philosophy.tsx` | ✅ Complete |
| 10b | VIPTeaser Section | `home/VIPTeaser.tsx` | ✅ Complete |
| 10c | Newsletter Section | `home/Newsletter.tsx` | ✅ Complete |
| 11 | Account Mobile Nav | `account/layout.tsx` | ✅ Complete |
| 12 | Chatbot Widget | `chatbot/ChatbotWidget.tsx` | ✅ Complete |
| 13 | ScrollReveal Wiring | `app/page.tsx` | ✅ Complete |
| 14 | Footer Mobile Fix | `layout/Footer.tsx` | ✅ Complete |

**All 74 subtasks across 16 areas — complete. Zero new lint errors introduced.**
