# CALŌR Codebase Audit Report

## Executive Summary
This audit identified **24 critical issues** across the codebase, including:
- 4 broken/incomplete core features (payment, auth, orders, sessions)
- 12 dead links (footer, navigation)
- 4 pages using mock data instead of real data
- 2 forms with no submission handlers
- 2 design violations (border-radius)
- Security vulnerability (admin bypass)

---

## CRITICAL ISSUES (Must Fix)

### 1. Payment Processing - COMPLETELY NON-FUNCTIONAL
**File:** `src/app/checkout/payment/page.tsx`
**Location:** Lines 41-51

**Problem:** Payment processing is SIMULATED with a timeout. No actual Stripe or Coinbase integration happens.

```tsx
// CURRENT CODE (BROKEN):
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsProcessing(true)
  
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000))  // <-- FAKE!
  
  // Clear cart and redirect
  clearCart()
  router.push('/checkout/confirmation')
}
```

**Impact:** No orders are created in the database. No payments are processed. Customers think they paid but nothing happened.

**Solution:** Implement actual order creation and Stripe/Coinbase integration.

---

### 2. Confirmation Page - FAKE ORDER NUMBER
**File:** `src/app/checkout/confirmation/page.tsx`
**Location:** Lines 7-8

**Problem:** Order number is randomly generated on client side instead of coming from a real order.

```tsx
// CURRENT CODE (BROKEN):
const orderNumber = `CAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
```

**Impact:** Order confirmation shows fake data. No link to real order.

**Solution:** Receive order reference from URL params or session, fetch real order from database.

---

### 3. Account Login/Register - NO FORM SUBMISSION
**File:** `src/app/account/page.tsx`
**Location:** Lines 24-58

**Problem:** Form has no `onSubmit` handler. It collects email/password but does nothing with them.

```tsx
// CURRENT CODE (BROKEN):
<form className="space-y-4">
  {/* inputs... */}
  <button type="submit">
    {isLogin ? 'Sign In' : 'Create Account'}
  </button>
</form>
```

**Impact:** Users cannot log in or create accounts.

**Solution:** Add `onSubmit` handler that calls `/api/auth/login` or `/api/auth/register`.

---

### 4. Admin Dashboard - NO SECURITY
**File:** `src/app/admin/page.tsx`
**Location:** Lines 9-11

**Problem:** Admin authentication check is commented out. Anyone can access admin.

```tsx
// CURRENT CODE (INSECURE):
// In production, check for admin flag in user record
// For now, allow access for demo purposes
// if (!session) redirect('/account')
```

**Impact:** Complete security vulnerability. Anyone can view all orders and customer data.

**Solution:** Implement proper admin role check.

---

### 5. Orders Page - MOCK DATA
**File:** `src/app/account/orders/page.tsx`
**Location:** Lines 5-27

**Problem:** Uses hardcoded mock orders instead of fetching from database.

```tsx
// CURRENT CODE (BROKEN):
const mockOrders = [
  { id: 'CAL-A7X9K2', date: 'January 15, 2025', status: 'Delivered', ... },
  { id: 'CAL-B3M8P1', date: 'January 8, 2025', status: 'Shipped', ... },
]
```

**Impact:** Users see fake orders, not their real order history.

**Solution:** Convert to server component and fetch orders from database using session.

---

### 6. Sessions Page - MOCK DATA
**File:** `src/app/account/sessions/page.tsx`
**Location:** Lines 6-23

**Problem:** Uses hardcoded mock sessions instead of fetching from database.

```tsx
// CURRENT CODE (BROKEN):
const mockSessions = [
  { id: '1', device: 'Chrome on Mac', location: 'San Francisco...', ... },
  { id: '2', device: 'Safari on iPhone', ... },
]
```

**Impact:** Users can't see or revoke their real sessions.

**Solution:** Fetch sessions from database, implement revoke functionality.

---

### 7. Wishlist Page - NOT CONNECTED TO STORE
**File:** `src/app/account/wishlist/page.tsx`
**Location:** Lines 16-24

**Problem:** Shows static "Nothing saved yet" message instead of reading from `useWishlistStore`.

```tsx
// CURRENT CODE (BROKEN):
<div className="text-center py-16 bg-warm-white border border-sand">
  <Heart className="w-12 h-12 text-warm-gray mx-auto mb-4" strokeWidth={1} />
  <p className="font-body text-warm-gray mb-4">
    Nothing saved yet. Take your time.
  </p>
```

**Impact:** Users can't see their saved wishlist items.

**Solution:** Read from `useWishlistStore` and display actual items with links to products.

---

### 8. Track Order Form - WRONG ACTION
**File:** `src/app/track-order/page.tsx`
**Location:** Line 19

**Problem:** Form action points to `/order` but the actual route is `/order/[reference]`.

```tsx
// CURRENT CODE (BROKEN):
<form action="/order" className="flex gap-0">
```

**Impact:** Form submit will 404.

**Solution:** Use client-side navigation or proper form handling.

---

## DEAD LINKS (404 Pages)

### Footer Links - 7 Dead Links
**File:** `src/components/layout/Footer.tsx`

| Line | Link | Status |
|------|------|--------|
| 15 | `/shipping` | MISSING |
| 18 | `/faq` | MISSING |
| 19 | `/contact` | MISSING |
| 25 | `/editorial-standards` | MISSING |
| 26 | `/partnerships` | MISSING |
| 27 | `/press` | MISSING |
| 28 | `/careers` | MISSING |
| 178 | `/legal/cookie-policy` | MISSING |

### Navigation Links - 1 Dead Link
**File:** `src/components/layout/Navigation.tsx`
**Line 13:** `#members` should be `/members`

### Admin Dashboard Links - 3 Dead Links
**File:** `src/app/admin/AdminClient.tsx`

| Line | Link | Status |
|------|------|--------|
| 76 | `/admin/products` | MISSING |
| 80 | `/admin/orders` | MISSING |
| 84 | `/admin/customers` | MISSING |

---

## DESIGN VIOLATIONS

### 1. Order Tracking - Border Radius
**File:** `src/app/order/[reference]/page.tsx`
**Line 18:** Uses `rounded-full` which violates sharp corners design.

```tsx
// CURRENT CODE (VIOLATION):
<div className="w-20 h-20 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-8">
```

**Solution:** Remove `rounded-full`.

### 2. Confirmation Page - Border Radius
**File:** `src/app/checkout/confirmation/page.tsx`
**Line 18:** Uses `rounded-full`.

```tsx
// CURRENT CODE (VIOLATION):
<div className="w-20 h-20 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-8">
```

**Solution:** Remove `rounded-full`.

---

## FORMS WITHOUT SUBMISSION HANDLERS

### 1. Members Page Email Form
**File:** `src/app/members/page.tsx`
**Line 29:** Form has no `onSubmit` handler.

```tsx
// CURRENT CODE (BROKEN):
<form className="flex gap-0 max-w-md mx-auto">
  <input type="email" placeholder="Your email" ... />
  <button type="submit">Notify Me</button>
</form>
```

**Solution:** Add `onSubmit` to call `/api/newsletter` or create members waitlist API.

---

## INCOMPLETE FEATURES

### 1. Card Form - Not Connected to Stripe Elements
**File:** `src/app/checkout/payment/page.tsx`
**Lines 119-135:** Plain input fields for card data instead of Stripe Elements.

```tsx
// CURRENT CODE (NOT SECURE):
<input type="text" placeholder="Card number" ... />
<input type="text" placeholder="MM / YY" ... />
<input type="text" placeholder="CVC" ... />
```

**Impact:** PCI compliance violation. Card data shouldn't touch our server.

**Solution:** Use Stripe Elements (`<CardElement>` or `<PaymentElement>`).

### 2. Order Creation Missing
No API endpoint exists to create orders. The payment flow should:
1. Create order in database
2. Create Stripe PaymentIntent or Coinbase charge
3. Redirect to confirmation with real order reference

### 3. Loyalty Points Not Awarded on Order
**File:** `src/lib/payments/stripe.ts` & `coinbase.ts`

Neither payment webhook awards loyalty points to customers.

**Solution:** Add loyalty point awarding logic to webhook handlers.

---

## MISSING PAGES

The following pages are referenced but don't exist:
1. `/shipping` - Shipping info page
2. `/faq` - FAQ page
3. `/contact` - Contact page
4. `/editorial-standards` - Editorial standards
5. `/partnerships` - Partnerships page
6. `/press` - Press page
7. `/careers` - Careers page
8. `/legal/cookie-policy` - Cookie policy
9. `/admin/products` - Admin products management
10. `/admin/orders` - Admin orders management
11. `/admin/customers` - Admin customers management

---

## WORKING FEATURES

### Fully Functional:
- Product browsing and filtering
- Category pages
- Product detail with alerts, safety info, usage guides
- Cart drawer functionality
- Wishlist store (local)
- Newsletter signup API
- Support chat WebSocket service
- Price drop alert APIs
- Stock alert APIs
- Loyalty point APIs
- Gift wrapping APIs
- Packaging photos API
- Anonymous gift API
- Order tracking page (when accessed with real reference)
- Admin dashboard stats display

### Partially Functional:
- Auth APIs (work but frontend doesn't use them)
- Payment webhooks (work but never triggered due to broken payment flow)

---

## PRIORITY FIX ORDER

### P0 - Critical (Site is broken):
1. Fix payment flow with actual order creation
2. Fix account login/register forms
3. Fix admin security

### P1 - High (Data integrity):
4. Connect orders page to real data
5. Connect sessions page to real data
6. Connect wishlist page to store

### P2 - Medium (User experience):
7. Fix dead links in footer
8. Fix track order form
9. Fix members form
10. Create missing pages

### P3 - Low (Polish):
11. Remove border-radius violations
12. Implement loyalty point awarding
13. Create admin sub-pages
