# Nebula Engine 🍔

A food expiry tracker that prevents waste. Add items with use-by dates via Telegram or email, and receive daily reminders. Runs on **Cloudflare Workers** (serverless) + **Turso** (cloud SQLite). **$0 cost** — all free tiers.

## Overview

- **Input**: Telegram messages, email, or local dashboard
- **Processing**: Parse dates, store in Turso, send daily reminders at 8am + 7pm
- **Output**: Telegram notifications, email, local web dashboard
- **Storage**: Cloud SQLite (Turso) — no server to manage

## Quick Start

### 1. Set up accounts (one-time)

See `/Users/leighmarshhorgan/.claude/plans/curious-meandering-crab.md` for detailed step-by-step instructions for:
- Telegram bot creation (@BotFather)
- Turso database setup
- Cloudflare Workers account
- Gmail API (optional, Phase 2)

### 2. Deploy the backend

```bash
# Install dependencies
npm install

# Add secrets to Cloudflare
wrangler secret put TURSO_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID

# Deploy
npm run deploy

# Set Telegram webhook (after deploy succeeds)
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://nebula-engine.<your-subdomain>.workers.dev/telegram-webhook"
```

### 3. Run the local dashboard

```bash
# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Turso URL and token

# Install GUI dependencies and start
npm run gui:dev
# Visit http://localhost:3000
```

## Usage

### Via Telegram
Message your bot:
- `chicken 2026-07-03` — add item with ISO date
- `milk 3d` — add item expiring in 3 days
- `eggs july 5` — natural date format
- `/list` — show all items
- `/remove chicken` — delete item

### Via Email (Phase 2)
Send an email with the subject line as the item (e.g., `chicken 2026-07-03`). Polled every 15 minutes.

### Via Dashboard (http://localhost:3000)
- View all items with expiry status
- Bulk add items (paste multiple lines)
- Edit/delete individual items inline
- Settings: reminder times, timezone, toggle notification channels

## Architecture

```
Phone (Telegram) → CF Worker webhook → Turso DB
Phone (Email)    → CF Worker cron (every 15 min) → Turso DB
Dashboard (localhost:3000) → API routes → Turso DB

CF Worker cron (8am/7pm UTC) → Query DB → Send Telegram + Email
```

## Project Structure

```
nebula-engine/
├── src/                          # Cloudflare Worker (serverless backend)
│   ├── index.ts                  # Worker entry point, webhook + cron
│   ├── db.ts                     # Turso client
│   ├── parser.ts                 # Date parser (ISO, relative, natural)
│   ├── telegram.ts               # Telegram bot API
│   ├── email-input.ts            # Gmail API polling (Phase 2)
│   ├── email-output.ts           # Gmail SMTP sending (Phase 2)
│   ├── notify.ts                 # Format and send reminders
│   ├── types.ts                  # TypeScript interfaces
│   └── parser.test.ts            # Parser unit tests
├── gui/                          # Next.js 16 local dashboard
│   ├── app/
│   │   ├── page.tsx              # Dashboard with item table
│   │   ├── settings/page.tsx     # Reminder settings
│   │   ├── layout.tsx            # Navigation layout
│   │   └── api/
│   │       ├── items/            # CRUD routes for items
│   │       └── settings/         # Settings API
│   ├── components/
│   │   ├── item-table.tsx        # Sortable, editable table
│   │   └── bulk-add.tsx          # Multi-line input form
│   ├── lib/db.ts                 # Turso client for GUI
│   ├── package.json
│   └── tsconfig.json
├── wrangler.toml                 # CF Worker config (cron triggers)
├── .env.example                  # Environment variables template
├── package.json                  # Root scripts
└── CLAUDE.md                     # Dev notes
```

## Commands

```bash
# Backend (Cloudflare Worker)
npm run dev                        # Local dev (wrangler dev)
npm run deploy                     # Deploy to Cloudflare
npm run test                       # Run parser tests
npm run typecheck                  # Type check

# Dashboard (Next.js GUI)
npm run gui:dev                    # Start dashboard on localhost:3000
npm run gui:build                  # Build for production
npm run gui:typecheck              # Type check GUI
```

## Environment Variables

**Backend** (`.env.local` or Cloudflare secrets):
- `TURSO_URL` — Turso database URL
- `TURSO_AUTH_TOKEN` — Turso auth token
- `TELEGRAM_BOT_TOKEN` — Telegram bot token (@BotFather)
- `TELEGRAM_CHAT_ID` — Your Telegram chat ID
- `GMAIL_CLIENT_ID` — Google OAuth client ID (optional, Phase 2)
- `GMAIL_CLIENT_SECRET` — Google OAuth secret (optional, Phase 2)
- `GMAIL_REFRESH_TOKEN` — Google refresh token (optional, Phase 2)
- `GMAIL_FROM_EMAIL` — Sender email (optional, Phase 2)
- `GMAIL_TO_EMAIL` — Recipient email (optional, Phase 2)

**Dashboard** (`.env.local`):
- `TURSO_URL` — Turso database URL (same as backend)
- `TURSO_AUTH_TOKEN` — Turso auth token (same as backend)

## Known Limitations & Next Steps

**Phase 4 (TODO)**:
- Duplicate detection (prevent adding same item twice)
- Auto-cleanup of expired items (>1 week old)
- More Telegram commands (`/help`, `/stats`)

## Troubleshooting

**Telegram messages not received?**
- Verify webhook: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Check CF Worker logs: `wrangler tail`

**Reminders not sending?**
- Ensure items with future expiry dates exist in DB
- Check wrangler.toml cron times (7am/6pm UTC = 8am/7pm BST)

**GUI won't connect to database?**
- Verify `TURSO_URL` and `TURSO_AUTH_TOKEN` in `.env.local`
- URL should be `libsql://your-slug.turso.io`

## Stack

- **Runtime**: Cloudflare Workers (serverless)
- **Storage**: Turso (cloud SQLite)
- **Dashboard**: Next.js 16 + React 19
- **Input APIs**: Telegram Bot API, Gmail API
- **Languages**: TypeScript, React
- **Testing**: Vitest
