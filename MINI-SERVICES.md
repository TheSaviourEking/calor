# CALOR Mini Services Documentation

This document explains how to run and manage the mini services that power CALOR's real-time features.

## Overview

CALOR uses independent mini services built with Bun to handle WebSocket connections for real-time features. These services run alongside the main Next.js application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CALOR Platform                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Next.js App   │    │  Mini Services  │                │
│  │   (Port 3000)   │    │                 │                │
│  │                 │    │ ┌─────────────┐ │                │
│  │  - API Routes   │    │ │ Live Stream │ │                │
│  │  - Pages        │    │ │  (Port 3032)│ │                │
│  │  - SSR/SSG      │    │ └─────────────┘ │                │
│  │                 │    │                 │                │
│  │                 │    │ ┌─────────────┐ │                │
│  │                 │    │ │Support Chat │ │                │
│  │                 │    │ │  (Port 3031)│ │                │
│  │                 │    │ └─────────────┘ │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │            Caddy Gateway                │               │
│  │  - Routes WebSocket via XTransformPort  │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Services

### 1. Support Chat Service (Port 3031)

Anonymous support chat system for customer assistance.

**Location:** `mini-services/support-chat/`

**Features:**
- Anonymous chat sessions
- Real-time messaging
- Typing indicators
- Session management
- Auto-response simulation (production: real support agents)

**Running the service:**
```bash
cd mini-services/support-chat
bun install
bun run dev
```

**WebSocket Events:**
| Event | Direction | Description |
|-------|-----------|-------------|
| `start_session` | Client → Server | Start a new support session |
| `rejoin_session` | Client → Server | Rejoin an existing session |
| `send_message` | Client → Server | Send a chat message |
| `typing` | Client → Server | Typing indicator |
| `end_session` | Client → Server | End the session |
| `session_started` | Server → Client | Session created |
| `message` | Server → Client | New message received |
| `user_typing` | Server → Client | Other user typing |

**Frontend Connection:**
```typescript
import { io } from 'socket.io-client'

const socket = io('/?XTransformPort=3031')
```

---

### 2. Live Stream Service (Port 3032)

Real-time live shopping platform with chat, offers, and analytics.

**Location:** `mini-services/live-stream/`

**Features:**
- Real-time viewer tracking
- Live chat with moderation
- Flash offers and product featuring
- Analytics and engagement tracking
- Host controls (pin, highlight messages)
- Product click and cart add tracking

**Running the service:**
```bash
cd mini-services/live-stream
bun install
bun run dev
```

**WebSocket Events:**
| Event | Direction | Description |
|-------|-----------|-------------|
| `join_stream` | Client → Server | Join a live stream |
| `leave_stream` | Client → Server | Leave a stream |
| `send_message` | Client → Server | Send chat message |
| `add_reaction` | Client → Server | React to message |
| `feature_product` | Host → Server | Feature a product |
| `activate_offer` | Host → Server | Activate flash offer |
| `claim_offer` | Client → Server | Claim an offer |
| `product_click` | Client → Server | Track product click |
| `cart_add` | Client → Server | Track cart addition |
| `pin_message` | Host → Server | Pin a chat message |
| `highlight_message` | Host → Server | Highlight message |
| `viewer_count_update` | Server → Client | Updated viewer count |
| `new_message` | Server → Client | New chat message |
| `product_featured` | Server → Client | Product featured |
| `offer_activated` | Server → Client | Offer activated |
| `offer_claimed` | Server → Client | Offer claimed |

**Frontend Connection:**
```typescript
import { io } from 'socket.io-client'

const socket = io('/?XTransformPort=3032')
```

---

## How to Run All Services

### Development (Manual)

Open separate terminal windows for each service:

```bash
# Terminal 1: Main Next.js app
bun run dev

# Terminal 2: Support Chat
cd mini-services/support-chat && bun run dev

# Terminal 3: Live Stream
cd mini-services/live-stream && bun run dev
```

### Using a Process Manager (Recommended for Production)

**PM2 Configuration:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'calor-main',
      script: 'bun',
      args: 'run dev',
      cwd: './',
    },
    {
      name: 'calor-support-chat',
      script: 'bun',
      args: 'run dev',
      cwd: './mini-services/support-chat',
    },
    {
      name: 'calor-live-stream',
      script: 'bun',
      args: 'run dev',
      cwd: './mini-services/live-stream',
    },
  ],
}
```

Run with:
```bash
pm2 start ecosystem.config.js
```

### Using concurrently (Development)

```bash
# Install concurrently
bun add -d concurrently

# Add to package.json scripts:
# "dev:all": "concurrently \"bun run dev\" \"cd mini-services/support-chat && bun run dev\" \"cd mini-services/live-stream && bun run dev\""

bun run dev:all
```

---

## Gateway Configuration

The Caddy gateway routes WebSocket connections based on the `XTransformPort` query parameter.

**Important Rules:**
1. Always use relative paths for WebSocket connections
2. Always include `XTransformPort` in the query string
3. Never use absolute URLs with port numbers

**Correct:**
```typescript
io('/?XTransformPort=3031')
io('/?XTransformPort=3032')
```

**Incorrect:**
```typescript
io('http://localhost:3031')
io('ws://localhost:3031')
```

---

## Database Access

Mini services share the same Prisma database as the main application:

```typescript
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
```

**Note:** The Prisma client is generated at the project root, so the import path works from mini services.

---

## Environment Variables

Mini services can access environment variables from the root `.env` file. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite/PostgreSQL connection string |

---

## Debugging

### Check if services are running:
```bash
# Check ports
lsof -i :3031
lsof -i :3032

# Check processes
ps aux | grep bun
```

### View logs:
Services log to stdout. In development, you'll see:
```
[Live Stream] Client connected: <socket-id>
[Live Stream] Client <socket-id> joined stream <stream-id>
Support chat service running on port 3031
```

---

## Troubleshooting

### Service won't start
- Check if port is already in use
- Ensure dependencies are installed (`bun install`)
- Verify database connection

### WebSocket connection fails
- Ensure `XTransformPort` is in query string
- Check Caddyfile configuration
- Verify service is running on expected port

### Database errors
- Run `bun run db:push` to sync schema
- Check `DATABASE_URL` is correct
- Ensure Prisma client is generated

---

## Adding New Mini Services

1. Create new directory in `mini-services/`
2. Create `package.json` with `bun --hot index.ts` script
3. Create `index.ts` with Socket.io server
4. Choose a unique port (3033, 3034, etc.)
5. Update this documentation

**Template:**
```typescript
import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3033 // Your port

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Your event handlers here
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Service running on port ${PORT}`)
})
```
