# CALŌR — Launch Checklist

Complete deployment guide. Go through each section in order.

---

## Phase 0: Pre-Launch Verification

### Local Build
- [ ] `bun run test` — 31 tests pass
- [ ] `bun run build` — compiles with 0 TypeScript errors
- [ ] `bun run lint` — under 50 warnings
- [ ] `bun run dev` — app loads at localhost:3000, pages render
- [ ] Git working tree is clean (`git status` shows nothing)
- [ ] All code is committed and pushed to GitHub

---

## Phase 1: Create Accounts (All Free Tier)

### 1.1 Domain Registrar
- [ ] Buy domain (e.g., `calorco.com`)
  - **Namecheap** ($8-12/year) or **Cloudflare Registrar** (at-cost)
  - Note your domain: `________________`

### 1.2 DNS — Cloudflare (free)
- [ ] Create Cloudflare account at [cloudflare.com](https://cloudflare.com)
- [ ] Add your domain to Cloudflare
- [ ] Update nameservers at your registrar to Cloudflare's nameservers
- [ ] Wait for DNS propagation (can take up to 24 hours)
- [ ] Set SSL/TLS mode to "Full (strict)" in Cloudflare dashboard

### 1.3 Email Hosting — Zoho Mail (free)
- [ ] Create Zoho account at [zoho.com/mail](https://zoho.com/mail)
- [ ] Add your domain, verify via Cloudflare DNS (TXT record)
- [ ] Create mailboxes:
  - [ ] `hello@yourdomain.com` — general inbox
  - [ ] `support@yourdomain.com` — customer support
  - [ ] `noreply@yourdomain.com` — for transactional emails (Resend sender)
- [ ] Add MX records in Cloudflare DNS (Zoho provides these)
- [ ] Add SPF, DKIM records for email deliverability
- [ ] Test: send email from Zoho to Gmail, confirm it arrives (not in spam)

### 1.4 Database — Neon (free)
- [ ] Create account at [neon.tech](https://neon.tech)
- [ ] Create a new project (name: `calor`)
- [ ] Select region closest to your hosting (e.g., `us-east-1`)
- [ ] Copy the connection string
- [ ] Save: `DATABASE_URL` = `_______________`

### 1.5 Hosting — Vercel (free)
- [ ] Create account at [vercel.com](https://vercel.com)
- [ ] Connect your GitHub account
- [ ] Import the `calor` repository
- [ ] **DO NOT deploy yet** — we need env vars first
- [ ] Note the project URL: `calor-xxx.vercel.app`

### 1.6 Mini-Services Hosting — Pick One
**Option A: Hetzner VPS (€3.29/month — best for premium brand)**
- [ ] Create account at [hetzner.com/cloud](https://hetzner.com/cloud)
- [ ] Create a CX22 server (2GB RAM, Ubuntu 24.04)
- [ ] Note the server IP: `________________`
- [ ] SSH in: `ssh root@YOUR_IP`
- [ ] Install Docker: `curl -fsSL https://get.docker.com | sh`
- [ ] Install Docker Compose: `apt install docker-compose-plugin`

**Option B: Koyeb (free — 1 service, ~5s cold start)**
- [ ] Create account at [koyeb.com](https://koyeb.com)
- [ ] Note: Free tier supports 1 service only — you'd need to combine mini-services

**Option C: Railway ($5/month credit)**
- [ ] Create account at [railway.app](https://railway.app)

### 1.7 Payments — Stripe (free to set up)
- [ ] Create account at [stripe.com](https://stripe.com)
- [ ] Complete business verification (required for live payments)
- [ ] Go to **Developers → API Keys**
- [ ] Save: `STRIPE_SECRET_KEY` = `sk_live_...` (or `sk_test_...` for testing)
- [ ] Save: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (or `pk_test_...`)
- [ ] Go to **Developers → Webhooks → Add endpoint**
  - URL: `https://yourdomain.com/api/stripe/webhook`
  - Events: Select all `payment_intent`, `charge`, `customer.subscription`, `invoice` events
- [ ] Save: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] Enable **Customer Portal** in Stripe settings (for subscription management)

### 1.8 Crypto Payments — Coinbase Commerce (free to set up)
- [ ] Create account at [commerce.coinbase.com](https://commerce.coinbase.com)
- [ ] Go to **Settings → Security**
- [ ] Save: `COINBASE_COMMERCE_API_KEY` = `_______________`
- [ ] Create webhook:
  - URL: `https://yourdomain.com/api/crypto/webhook`
  - Events: All charge events
- [ ] Save: `COINBASE_WEBHOOK_SECRET` = `_______________`

### 1.9 Transactional Email — Resend (free: 100 emails/day)
- [ ] Create account at [resend.com](https://resend.com)
- [ ] Add and verify your domain (add DNS records in Cloudflare)
- [ ] Go to **API Keys → Create**
- [ ] Save: `RESEND_API_KEY` = `re_...`
- [ ] Set sender as: `CALŌR <noreply@yourdomain.com>`

### 1.10 Image Storage — Cloudflare R2 (free: 10GB)
- [ ] In Cloudflare dashboard → **R2 Object Storage**
- [ ] Create bucket named `calor-uploads`
- [ ] Go to **R2 → Manage R2 API Tokens → Create Token**
  - Permissions: Object Read & Write
  - Bucket: `calor-uploads`
- [ ] Save: `R2_ACCOUNT_ID` = `_______________`
- [ ] Save: `R2_ACCESS_KEY_ID` = `_______________`
- [ ] Save: `R2_SECRET_ACCESS_KEY` = `_______________`
- [ ] Save: `R2_BUCKET_NAME` = `calor-uploads`
- [ ] Enable public access or set up a custom domain for the bucket
- [ ] Save: `R2_PUBLIC_URL` = `https://your-r2-domain.com`
- [ ] Add R2 domain to `next.config.ts` `images.remotePatterns` if using custom domain

### 1.11 Error Monitoring — Sentry (free: 5K errors/month)
- [ ] Create account at [sentry.io](https://sentry.io)
- [ ] Create project → Platform: Next.js
- [ ] Go to **Settings → Client Keys**
- [ ] Save: `NEXT_PUBLIC_SENTRY_DSN` = `https://xxx@xxx.ingest.sentry.io/xxx`
- [ ] (Optional) Save: `SENTRY_AUTH_TOKEN` for source maps

### 1.12 Rate Limiting — Upstash Redis (free: 10K commands/day)
- [ ] Create account at [upstash.com](https://upstash.com)
- [ ] Create a Redis database (same region as hosting)
- [ ] Save: `UPSTASH_REDIS_REST_URL` = `_______________`
- [ ] Save: `UPSTASH_REDIS_REST_TOKEN` = `_______________`

### 1.13 Video Streaming — LiveKit Cloud (free: 50GB bandwidth/month)
- [ ] Create account at [livekit.io](https://livekit.io)
- [ ] Create a new project
- [ ] Go to **Settings → Keys**
- [ ] Save: `LIVEKIT_API_KEY` = `_______________`
- [ ] Save: `LIVEKIT_API_SECRET` = `_______________`
- [ ] Save: `NEXT_PUBLIC_LIVEKIT_URL` = `wss://your-project.livekit.cloud`

### 1.14 Exchange Rates — OpenExchangeRates (free: 1K requests/month)
- [ ] Create account at [openexchangerates.org](https://openexchangerates.org)
- [ ] Save: `OPENEXCHANGERATES_APP_ID` = `_______________`

### 1.15 Google OAuth (optional — skip if email auth is enough)
- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Create project → Enable Google+ API
- [ ] Credentials → Create OAuth Client ID
  - Authorized redirect URI: `https://yourdomain.com/api/auth/oauth/google`
- [ ] Save: `GOOGLE_CLIENT_ID` = `_______________`
- [ ] Save: `GOOGLE_CLIENT_SECRET` = `_______________`

### 1.16 Apple OAuth (optional)
- [ ] Go to [developer.apple.com](https://developer.apple.com)
- [ ] Register App ID, create Services ID, generate key
- [ ] Save: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`

---

## Phase 2: Generate Secrets

Run these locally and save the output:

```bash
# JWT Secret (required)
openssl rand -base64 32
# → JWT_SECRET = _______________

# Cron Secret (required)
openssl rand -hex 16
# → CRON_SECRET = _______________
```

---

## Phase 3: Deploy Database

### 3.1 Run Migrations
```bash
# Set the Neon DATABASE_URL in your terminal
export DATABASE_URL="postgresql://user:pass@xxx.neon.tech/calor?sslmode=require"

# Push schema to production database
bunx prisma db push

# Or if you want migration history:
bunx prisma migrate deploy
```
- [ ] Schema pushed successfully (no errors)

### 3.2 Seed Initial Data
```bash
# Seed core data (categories, products, VIP tiers, etc.)
bun run prisma/seed.ts

# Seed chatbot knowledge base
bun run prisma/seed-knowledge.ts

# Seed VIP/loyalty tiers and rewards
bun run seed-phase5.ts

# Seed wellness data (achievements, challenges, daily rewards)
bun run scripts/seed-wellness.ts

# Create test accounts (admin + customer)
bun run scripts/create-test-users.ts
```
- [ ] All seeds ran without errors
- [ ] Verify: `bunx prisma studio` — check tables have data

### 3.3 Sync Stripe Products
```bash
# This will create Stripe Products and Prices for subscription plans
# Run once after seeding:
bun -e "
  const { ensureStripeProducts } = require('./src/lib/payments/stripe-subscriptions');
  ensureStripeProducts().then(() => console.log('Done')).catch(console.error);
"
```
- [ ] Subscription plans synced to Stripe (check Stripe dashboard → Products)

---

## Phase 4: Deploy Mini-Services (VPS)

*Skip this section if using Vercel-only (no live streaming/chat features)*

### 4.1 Prepare the VPS
```bash
# SSH into your server
ssh root@YOUR_IP

# Clone the repo
git clone https://github.com/YOUR_USERNAME/calor.git /opt/calor
cd /opt/calor

# Create env file for mini-services
cat > .env.production << 'EOF'
DATABASE_URL=postgresql://user:pass@xxx.neon.tech/calor?sslmode=require
SOCKET_IO_ORIGINS=https://yourdomain.com
NODE_ENV=production
EOF
```

### 4.2 Deploy with Docker Compose (mini-services only)
```bash
# Create a docker-compose.prod.yml for just mini-services
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'
services:
  support-chat:
    build: ./mini-services/support-chat
    ports:
      - "3031:3031"
    env_file: .env.production
    restart: always

  live-stream:
    build: ./mini-services/live-stream
    ports:
      - "3032:3032"
    env_file: .env.production
    restart: always

  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile.prod:/etc/caddy/Caddyfile
      - caddy_data:/data
    restart: always

volumes:
  caddy_data:
EOF

# Create production Caddyfile with SSL
cat > Caddyfile.prod << 'EOF'
chat.yourdomain.com {
  reverse_proxy support-chat:3031
}

stream.yourdomain.com {
  reverse_proxy live-stream:3032
}
EOF

# Deploy
docker compose -f docker-compose.prod.yml up -d
```
- [ ] `docker compose -f docker-compose.prod.yml ps` — all services healthy
- [ ] `curl https://chat.yourdomain.com` — responds (may be upgrade required for WebSocket)
- [ ] `curl https://stream.yourdomain.com` — responds

### 4.3 DNS for Mini-Services
In Cloudflare DNS:
- [ ] A record: `chat.yourdomain.com` → `YOUR_VPS_IP` (proxy disabled — grey cloud for WebSocket)
- [ ] A record: `stream.yourdomain.com` → `YOUR_VPS_IP` (proxy disabled — grey cloud for WebSocket)

---

## Phase 5: Deploy Web App (Vercel)

### 5.1 Set Environment Variables in Vercel

Go to your Vercel project → **Settings → Environment Variables**

Add ALL of these (Production environment):

**Required:**
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | Generated in Phase 2 |
| `STRIPE_SECRET_KEY` | From Phase 1.7 |
| `STRIPE_WEBHOOK_SECRET` | From Phase 1.7 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | From Phase 1.7 |
| `COINBASE_COMMERCE_API_KEY` | From Phase 1.8 |
| `COINBASE_WEBHOOK_SECRET` | From Phase 1.8 |
| `RESEND_API_KEY` | From Phase 1.9 |
| `CRON_SECRET` | Generated in Phase 2 |
| `NEXT_PUBLIC_BASE_URL` | `https://yourdomain.com` |

**Mini-Services:**
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPPORT_CHAT_URL` | `https://chat.yourdomain.com` |
| `NEXT_PUBLIC_LIVE_STREAM_URL` | `https://stream.yourdomain.com` |
| `SOCKET_IO_ORIGINS` | `https://yourdomain.com` |

**Image Storage:**
| Variable | Value |
|----------|-------|
| `R2_ACCOUNT_ID` | From Phase 1.10 |
| `R2_ACCESS_KEY_ID` | From Phase 1.10 |
| `R2_SECRET_ACCESS_KEY` | From Phase 1.10 |
| `R2_BUCKET_NAME` | `calor-uploads` |
| `R2_PUBLIC_URL` | From Phase 1.10 |

**Monitoring & Services:**
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | From Phase 1.11 |
| `UPSTASH_REDIS_REST_URL` | From Phase 1.12 |
| `UPSTASH_REDIS_REST_TOKEN` | From Phase 1.12 |
| `LIVEKIT_API_KEY` | From Phase 1.13 |
| `LIVEKIT_API_SECRET` | From Phase 1.13 |
| `NEXT_PUBLIC_LIVEKIT_URL` | From Phase 1.13 |
| `OPENEXCHANGERATES_APP_ID` | From Phase 1.14 |

**Optional OAuth:**
| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | From Phase 1.15 (if configured) |
| `GOOGLE_CLIENT_SECRET` | From Phase 1.15 (if configured) |

- [ ] All environment variables added to Vercel

### 5.2 Deploy
- [ ] Push to `main` branch or click "Deploy" in Vercel dashboard
- [ ] Build succeeds (check Vercel deployment logs)
- [ ] Site is live at `calor-xxx.vercel.app`

### 5.3 Custom Domain
In Vercel → **Settings → Domains**:
- [ ] Add `yourdomain.com`
- [ ] Add `www.yourdomain.com`
- [ ] Vercel gives you DNS records — add them in Cloudflare:
  - CNAME: `@` → `cname.vercel-dns.com` (or A records they provide)
  - CNAME: `www` → `cname.vercel-dns.com`
- [ ] If using Cloudflare proxy (orange cloud): Set SSL to "Full (strict)"
- [ ] Wait for SSL certificate provisioning
- [ ] `https://yourdomain.com` loads the homepage

---

## Phase 6: Post-Deploy Verification

### 6.1 Core Functionality
- [ ] Homepage loads with all sections (Hero, Categories, Featured Products, etc.)
- [ ] Navigation works — all links go to correct pages
- [ ] Shop page loads products from database
- [ ] Product detail page renders with images, variants, reviews section
- [ ] Search works — returns relevant results

### 6.2 Authentication
- [ ] Register a new account → verification email arrives
- [ ] Login with email/password → redirects to account page
- [ ] Logout → redirected to age gate
- [ ] Forgot password → reset email arrives → password reset works
- [ ] (If configured) Google OAuth login works
- [ ] (If configured) Apple OAuth login works
- [ ] Rate limiting: try 6 login attempts → get blocked after 5th

### 6.3 Shopping Flow
- [ ] Add product to cart → cart drawer opens with item
- [ ] Update quantity in cart → total updates
- [ ] Go to checkout → form renders
- [ ] Fill checkout form → proceed to payment
- [ ] Verify: sessionStorage has only UUID, NOT PII
- [ ] (Test mode) Complete Stripe payment → order confirmation page
- [ ] Order confirmation email arrives
- [ ] Order appears in account → Orders page

### 6.4 Admin Panel
- [ ] Login as admin (admin@calor.com / Admin123!)
- [ ] `/admin` — dashboard loads with stats
- [ ] `/admin/products` — product list renders
- [ ] `/admin/products/new` — create a product
- [ ] `/admin/orders` — orders list
- [ ] `/admin/customers` — customer list
- [ ] `/admin/reviews` — review moderation (approve/reject)
- [ ] `/admin/support` — support tickets
- [ ] `/admin/chat` — live chat dashboard (connects to support-chat service)

### 6.5 Live Streaming (requires VPS)
- [ ] Host page: `/host/dashboard` loads
- [ ] Create a stream → appears in stream list
- [ ] Edit stream details → changes save
- [ ] Go live → LiveKit video publishes (camera/mic)
- [ ] Open `/live` in another browser → stream appears
- [ ] Viewer: video plays, chat works, products panel shows
- [ ] End stream → viewers see "Stream ended"

### 6.6 Support Chat (requires VPS)
- [ ] `/support` → anonymous chat starts
- [ ] Send message → welcome message + auto-response appear
- [ ] Open `/admin/chat` in another browser → session visible
- [ ] Admin replies → customer sees reply (no auto-response)
- [ ] Close session → customer notified

### 6.7 Subscriptions
- [ ] `/subscriptions` → plans render with prices
- [ ] Click "Subscribe" → redirects to Stripe Checkout
- [ ] Complete payment (test card: 4242 4242 4242 4242)
- [ ] Webhook fires → subscription created in database
- [ ] Click "Manage Billing" → opens Stripe Customer Portal
- [ ] Cancel subscription → webhook updates status

### 6.8 Image Uploads
- [ ] Admin creates product with image → upload succeeds to R2
- [ ] Image loads on product page from R2 URL
- [ ] Try uploading a .exe file → rejected with error
- [ ] Try uploading >5MB image → rejected with error

### 6.9 Error Monitoring
- [ ] Trigger an error (visit a broken URL or cause a server error)
- [ ] Error appears in Sentry dashboard
- [ ] Error boundary page renders (not a blank white page)

### 6.10 Cookie Consent
- [ ] First visit → cookie consent banner appears at bottom
- [ ] Click "Accept All" → banner disappears, `calor_consent` cookie set
- [ ] Refresh → banner doesn't reappear
- [ ] Clear cookies → banner reappears

### 6.11 Security Headers
```bash
curl -I https://yourdomain.com
```
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] `X-Frame-Options: DENY` present
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` present

### 6.12 SEO
- [ ] View page source on product page → `<script type="application/ld+json">` present (Product schema)
- [ ] View page source on homepage → Organization schema present
- [ ] Check: `https://yourdomain.com/sitemap.xml` (if Next.js generates one)
- [ ] Open Graph: share URL on Twitter/Slack → preview card renders

---

## Phase 7: Stripe Webhook Verification

This is critical — payments won't process without working webhooks.

```bash
# Install Stripe CLI (for testing)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your deployed app
stripe listen --forward-to https://yourdomain.com/api/stripe/webhook

# In another terminal, trigger a test event
stripe trigger payment_intent.succeeded
```
- [ ] Webhook received → order status updated
- [ ] Check Stripe dashboard → Webhooks → Recent deliveries → all 200 OK

---

## Phase 8: Cron Jobs

Set up scheduled tasks for automated maintenance:

### Vercel Cron (vercel.json)
Create `vercel.json` in project root if it doesn't exist:
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
- [ ] Deploy with cron config
- [ ] Each cron URL requires `Authorization: Bearer CRON_SECRET` header
- [ ] Verify in Vercel dashboard → Cron Jobs → shows scheduled

---

## Phase 9: Final Checks

### Performance
- [ ] Run Lighthouse on homepage → score > 80 for Performance
- [ ] Run Lighthouse on product page → score > 80
- [ ] Check Core Web Vitals in Vercel dashboard

### Security
- [ ] Run [securityheaders.com](https://securityheaders.com) scan → grade B or better
- [ ] Verify HTTPS works on all domains (main + subdomains)
- [ ] Verify age gate appears on first visit
- [ ] Verify protected routes redirect to login when not authenticated
- [ ] Verify admin routes are inaccessible to non-admin users

### Backups
- [ ] Neon has point-in-time recovery enabled (free tier includes this)
- [ ] Test: can you restore from Neon's backup UI?

### Monitoring
- [ ] Sentry receives errors
- [ ] Vercel analytics shows traffic
- [ ] Stripe dashboard shows webhook deliveries

---

## Quick Reference: All Service URLs

| Service | URL | Dashboard |
|---------|-----|-----------|
| **Web App** | `https://yourdomain.com` | Vercel dashboard |
| **Support Chat** | `https://chat.yourdomain.com` | VPS |
| **Live Stream** | `https://stream.yourdomain.com` | VPS |
| **Database** | Neon connection string | neon.tech |
| **Payments** | — | dashboard.stripe.com |
| **Email** | — | resend.com |
| **Images** | R2 public URL | Cloudflare R2 |
| **Monitoring** | — | sentry.io |
| **Redis** | — | upstash.com |
| **Video** | — | livekit.io |
| **DNS** | — | Cloudflare |
| **Email Inbox** | — | mail.zoho.com |

---

## Monthly Costs Summary

| Service | Cost |
|---------|------|
| Domain | ~$1/month (yearly billing) |
| Vercel | Free |
| Neon (PostgreSQL) | Free (0.5GB) |
| Hetzner VPS | €3.29/month |
| Stripe | 2.9% + 30¢ per transaction |
| Resend | Free (100 emails/day) |
| Cloudflare R2 | Free (10GB) |
| Cloudflare DNS | Free |
| Sentry | Free (5K errors) |
| Upstash Redis | Free (10K/day) |
| LiveKit Cloud | Free (50GB) |
| Zoho Mail | Free (5 users) |
| **Total fixed** | **~$4.50/month** |
