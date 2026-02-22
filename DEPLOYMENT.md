# CALŌR Platform - Deployment Guide

Complete guide to deploy and run the CALŌR e-commerce platform on your own server.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Installation Steps](#installation-steps)
6. [Running the Application](#running-the-application)
7. [Mini Services](#mini-services)
8. [Production Deployment](#production-deployment)
9. [Post-Deployment Setup](#post-deployment-setup)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Bun** | 1.0+ | JavaScript runtime & package manager |
| **Node.js** | 18+ | Alternative runtime (optional) |
| **Git** | Latest | Version control |

### System Requirements

- **OS**: Linux (Ubuntu 22.04+ recommended), macOS, or Windows with WSL2
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: 10GB+ for application, database, and uploads
- **CPU**: 2+ cores recommended

### External Services (Optional but Recommended)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Stripe** | Payment processing | Yes |
| **Resend** | Email delivery | Yes (100/day) |
| **Google Cloud** | OAuth login, Places API | Yes |
| **Apple Developer** | Apple Sign In | $99/year |
| **Coinbase Commerce** | Crypto payments | Yes |

---

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd calor

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Initialize database
bun run db:push

# 5. Start development server
bun run dev

# Open http://localhost:3000
```

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

### Core Configuration (Required)

```bash
# Database
DATABASE_URL="file:./db/production.db"    # SQLite (development)
# DATABASE_URL="postgresql://user:pass@host:5432/calor"  # PostgreSQL (production)

# Application
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="CALŌR"
```

### Payment Processing

```bash
# Stripe (Required for card payments)
STRIPE_SECRET_KEY="sk_live_..."           # Live key
STRIPE_PUBLISHABLE_KEY="pk_live_..."      # Live key
STRIPE_WEBHOOK_SECRET="whsec_..."         # From Stripe Dashboard

# Coinbase Commerce (Optional - Crypto payments)
COINBASE_API_KEY="your-coinbase-api-key"
COINBASE_WEBHOOK_SECRET="your-webhook-secret"
```

### Email Service

```bash
# Resend (Required for email delivery)
RESEND_API_KEY="re_..."                   # Get from resend.com
EMAIL_FROM="CALŌR <noreply@yourdomain.com>"
```

### Authentication

```bash
# Session Secret (Generate a random 32+ char string)
SESSION_SECRET="your-random-session-secret-min-32-chars"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple Sign In (Optional)
APPLE_CLIENT_ID="com.yourdomain.app"
APPLE_TEAM_ID="YOURTEAMID"
APPLE_KEY_ID="YOURKEYID"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### API Keys

```bash
# Google Places (For address autocomplete)
GOOGLE_PLACES_API_KEY="your-google-places-api-key"

# AI Services (For chatbot, recommendations)
# These use z-ai-web-dev-sdk
```

### Cron Jobs (Production)

```bash
# Secret key for cron job endpoints
CRON_SECRET_KEY="your-cron-secret-key"
```

### Crypto Payment (Optional)

```bash
# Coinbase Commerce
COINBASE_API_KEY="your-api-key"
COINBASE_WEBHOOK_SECRET="your-webhook-secret"
```

---

## Database Setup

### SQLite (Development/Small Deployments)

```bash
# Already configured by default
DATABASE_URL="file:./db/production.db"

# Initialize
bun run db:push
```

### PostgreSQL (Production)

1. **Create PostgreSQL database:**
```sql
CREATE DATABASE calor;
CREATE USER calor_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE calor TO calor_user;
```

2. **Update `.env`:**
```bash
DATABASE_URL="postgresql://calor_user:your_password@localhost:5432/calor"
```

3. **Initialize:**
```bash
bun run db:push
```

### Database Commands

```bash
# Push schema changes to database
bun run db:push

# Generate Prisma client
bun run db:generate

# Create a migration (PostgreSQL)
bun run db:migrate

# Reset database (WARNING: deletes all data)
bun run db:reset
```

---

## Installation Steps

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd calor

# Install all dependencies
bun install
```

### Step 2: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env  # or your preferred editor
```

### Step 3: Database Initialization

```bash
# Create database schema
bun run db:push

# Generate Prisma client
bun run db:generate
```

### Step 4: Build for Production

```bash
# Build the application
bun run build
```

---

## Running the Application

### Development Mode

```bash
# Start development server (port 3000)
bun run dev

# Check linting
bun run lint
```

Access: `http://localhost:3000`

### Production Mode

```bash
# Build first
bun run build

# Start production server
bun start
```

### Process Manager (PM2)

For production, use a process manager:

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start "bun start" --name "calor-app"

# Save PM2 configuration
pm2 save

# Enable auto-start on boot
pm2 startup
```

---

## Mini Services

CALŌR uses WebSocket mini services for real-time features. These run on separate ports.

### Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Support Chat | 3031 | Real-time customer support chat |
| Live Stream | 3032 | Live shopping, viewer tracking, offers |

### Starting Mini Services

**Option 1: Manual (Development)**
```bash
# Terminal 1: Main app
bun run dev

# Terminal 2: Support chat service
cd mini-services/support-chat && bun install && bun run dev

# Terminal 3: Live stream service
cd mini-services/live-stream && bun install && bun run dev
```

**Option 2: PM2 Ecosystem (Production)**

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'calor-main',
      script: 'bun',
      args: 'start',
      cwd: '/path/to/calor',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'calor-support-chat',
      script: 'bun',
      args: 'run dev',
      cwd: '/path/to/calor/mini-services/support-chat',
    },
    {
      name: 'calor-live-stream',
      script: 'bun',
      args: 'run dev',
      cwd: '/path/to/calor/mini-services/live-stream',
    },
  ],
}
```

Start all services:
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Gateway Configuration

The application uses Caddy as a reverse proxy. WebSocket connections require the `XTransformPort` query parameter:

```javascript
// Correct WebSocket connection
const socket = io('/?XTransformPort=3031')  // Support chat
const socket = io('/?XTransformPort=3032')  // Live stream
```

---

## Production Deployment

### Option 1: VPS (Ubuntu)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install PM2
npm install -g pm2

# Install Caddy (reverse proxy)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### 2. Deploy Application

```bash
# Clone to /var/www
sudo mkdir -p /var/www/calor
sudo chown $USER:$USER /var/www/calor
cd /var/www/calor
git clone <your-repo> .

# Install dependencies
bun install

# Set up environment
nano .env  # Add your production values

# Initialize database
bun run db:push

# Build application
bun run build
```

#### 3. Configure Caddy

Create `/etc/caddy/Caddyfile`:
```
yourdomain.com {
    encode gzip
    
    reverse_proxy localhost:3000
}

# WebSocket routes are handled automatically via XTransformPort
```

Restart Caddy:
```bash
sudo systemctl restart caddy
```

#### 4. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the printed instructions
```

### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
COPY prisma ./prisma/
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate
RUN bun run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["bun", "server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/app/data/production.db
    volumes:
      - ./data:/app/data
      - ./prisma:/app/prisma
  
  support-chat:
    build: ./mini-services/support-chat
    ports:
      - "3031:3031"
    depends_on:
      - app
  
  live-stream:
    build: ./mini-services/live-stream
    ports:
      - "3032:3032"
    depends_on:
      - app
```

Run:
```bash
docker-compose up -d
```

### Option 3: Platform as a Service (PaaS)

**Vercel (Recommended for Next.js):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Note:** WebSocket mini services need separate hosting for real-time features.

---

## Post-Deployment Setup

### 1. Create Admin Account

```bash
# Access your application and register normally, then:
# Option A: Use Prisma Studio
bunx prisma studio
# Find your user, set isAdmin = true

# Option B: Direct database update
sqlite3 db/production.db "UPDATE Customer SET isAdmin = 1 WHERE email = 'your@email.com';"
```

### 2. Seed Initial Data

The application auto-seeds:
- Product categories
- VIP tiers (Bronze, Silver, Gold, Platinum)
- VIP benefits
- Points rewards
- Chatbot knowledge base
- Support ticket categories

### 3. Configure Cron Jobs (Production)

Set up cron jobs for automated tasks:

```bash
# Edit crontab
crontab -e

# Add these lines (adjust URL and secret):
# Hourly: Gift card delivery
0 * * * * curl -X POST https://yourdomain.com/api/cron/gift-cards -H "X-Cron-Key: your-cron-secret-key"

# Hourly: Abandoned cart recovery
0 * * * * curl -X POST https://yourdomain.com/api/cron/abandoned-cart -H "X-Cron-Key: your-cron-secret-key"

# Hourly: Stock alerts
0 * * * * curl -X POST https://yourdomain.com/api/cron/stock-alerts -H "X-Cron-Key: your-cron-secret-key"

# Daily: Price drop alerts
0 9 * * * curl -X POST https://yourdomain.com/api/cron/price-alerts -H "X-Cron-Key: your-cron-secret-key"
```

### 4. Set Up SSL (if not using Caddy)

```bash
# Using Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 5. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Events to listen: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## Test Credentials

Use these for testing after deployment:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@calor.com | Admin123! |
| **Customer** | test@calor.com | Test123! |

---

## Troubleshooting

### Database Issues

```bash
# Reset Prisma client
rm -rf node_modules/.prisma
bun run db:generate

# Check database connection
bunx prisma db pull

# View database
bunx prisma studio
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
bun run build

# Clear all caches
rm -rf .next node_modules/.cache
bun install
bun run build
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### WebSocket Connection Failed

1. Ensure mini services are running
2. Check Caddyfile configuration
3. Verify `XTransformPort` is in query string
4. Check CORS settings

### Email Not Sending

1. Verify `RESEND_API_KEY` is correct
2. Check Resend dashboard for errors
3. Test at `/admin/email-test`

### Payments Not Working

1. Verify Stripe keys (use test keys for development)
2. Check webhook configuration
3. Review Stripe Dashboard logs

---

## Monitoring

### Logs

```bash
# PM2 logs
pm2 logs

# Application logs
tail -f dev.log        # Development
tail -f server.log     # Production

# Mini services logs
pm2 logs calor-support-chat
pm2 logs calor-live-stream
```

### Health Check

Create a health check endpoint or use:
- Main app: `GET /api/health` (create this if needed)
- Database: Check via Prisma Studio

---

## Security Checklist

- [ ] Strong `SESSION_SECRET` (32+ random characters)
- [ ] HTTPS enabled
- [ ] `CRON_SECRET_KEY` configured
- [ ] Stripe webhook secret configured
- [ ] Admin account created
- [ ] Rate limiting enabled (via Caddy or Next.js)
- [ ] Environment variables not exposed to client
- [ ] Database backups configured
- [ ] Error monitoring set up (optional: Sentry)

---

## Backup Strategy

### Database Backup

```bash
# SQLite
cp db/production.db db/backup-$(date +%Y%m%d).db

# PostgreSQL
pg_dump calor > backup-$(date +%Y%m%d).sql
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * cp /var/www/calor/db/production.db /var/www/calor/backups/db-$(date +\%Y\%m\%d).db
```

---

## Support

For issues or questions:
- Check the [worklog.md](./worklog.md) for implementation details
- Review [MINI-SERVICES.md](./MINI-SERVICES.md) for WebSocket services
- Check application logs for errors

---

## License

Private - All rights reserved.
