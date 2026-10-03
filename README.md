# CALŌR - Premium Wellness E-Commerce Platform

A complete, production-ready e-commerce platform for the wellness industry with AI-powered features, live shopping, wellness tracking, and more.

---

## Features Overview

### E-Commerce Core
- 🛍️ **Product Catalog** - Categories, variants, digital products
- 🛒 **Shopping Cart** - Guest & authenticated checkout
- 💳 **Multiple Payment Methods** - Stripe, Crypto, Bank Transfer
- 📦 **Order Management** - Tracking, status updates, returns
- 🎁 **Gift Cards** - Digital delivery, scheduling, partial redemption

### Customer Features
- 👤 **Account Management** - Profile, addresses, security
- 💎 **VIP/Loyalty Program** - 4 tiers, points, rewards store
- 💕 **Couples Accounts** - Link accounts, shared wishlist
- 📝 **Wishlist** - Save items, share publicly
- ⭐ **Reviews & Ratings** - Verified purchases, helpfulness voting

### Marketing & Promotions
- 🏷️ **Promo Codes** - Percentage, fixed, free shipping
- ⚡ **Flash Sales** - Countdown timers, limited offers
- 🎁 **Product Bundles** - Grouped products with savings
- 👥 **Referral Program** - $10 credit for referrer & referee
- 📧 **Email Campaigns** - Segmented campaigns, scheduling

### AI & Personalization
- 🤖 **AI Chatbot** - Support assistance, intent detection
- 📊 **Product Recommendations** - Personalized suggestions
- 🎯 **Customer Segmentation** - RFM analysis, targeting

### Live Shopping
- 📺 **Live Streaming** - Real-time broadcasts
- 💬 **Live Chat** - Viewer engagement, moderation
- 🛍️ **Flash Offers** - In-stream promotions
- 👑 **Host Dashboard** - Analytics, controls

### Wellness Platform
- 🧘 **Wellness Dashboard** - Daily check-ins, streaks
- 🎮 **Gamification** - Achievements, challenges, rewards
- 💑 **Couple Wellness** - Shared goals, connection scores
- 🎮 **Smart Toy Integration** - Pattern creator, sessions

### Gift Registry
- 💒 **Multiple Event Types** - Wedding, birthday, baby shower
- 🎁 **Group Gifting** - Partial contributions
- 💌 **Thank You Tracking** - Manage acknowledgments

### Admin Tools
- 📊 **Analytics Dashboard** - Revenue, orders, customers
- 🎫 **Support Ticket System** - Categories, SLA, internal notes
- 📝 **Audit Logs** - Action tracking
- 📧 **Email Campaign Manager** - Create, schedule, track

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL (Prisma ORM) |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui |
| **State** | Zustand |
| **Payments** | Stripe, Coinbase Commerce |
| **Email** | Resend |
| **Real-time** | Socket.io |

---

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env

# Initialize database
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@calor.com | Admin123! |
| Customer | test@calor.com | Test123! |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | Accounts, env vars and go-live steps |
| [PROD_CHECKLIST.md](./PROD_CHECKLIST.md) | Production readiness checklist |
| [worklog.md](./worklog.md) | Development history |

---

## Project Structure

```
calor/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (119+ endpoints)
│   │   ├── admin/              # Admin dashboard
│   │   ├── account/            # Customer account pages
│   │   ├── shop/               # Shop pages
│   │   ├── checkout/           # Checkout flow
│   │   └── ...
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components
│   │   ├── product/            # Product components
│   │   └── ...
│   ├── lib/                    # Utilities
│   │   ├── db.ts               # Prisma client
│   │   ├── email/              # Email service
│   │   └── ...
│   └── stores/                 # Zustand stores
├── prisma/
│   └── schema.prisma           # Database schema (117+ models)
└── mini-services/              # WebSocket services
    ├── support-chat/           # Port 3031
    └── live-stream/            # Port 3032
```

---

## Available Scripts

```bash
# Development
bun run dev          # Start development server
bun run lint         # Run ESLint

# Database
bun run db:push      # Push schema changes
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Create migration
bun run db:reset     # Reset database

# Production
bun run build        # Build for production
bun start            # Start production server
```

---

## Platform Statistics

- **API Endpoints**: 119+
- **Database Models**: 117+
- **Features**: 90+
- **Pages**: 60+

---

## License

Private - All rights reserved.
