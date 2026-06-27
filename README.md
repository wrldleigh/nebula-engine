# Nebula Engine 🍔🌌

A cosmic food expiry tracker that prevents waste through real-time Telegram notifications and a beautiful local dashboard. Built serverless on **Cloudflare Workers** with **Turso** cloud SQLite. **$0 cost** — completely free.

> **Status**: Production-ready with full feature set (Phases 1-4 complete)

## 🎯 What This Does

Nebula Engine helps you:
- **Track expiry dates** for all your food items
- **Receive daily reminders** via Telegram (8am & 7pm, customizable)
- **Add items** via Telegram, local dashboard, or multiple date formats
- **View & manage** inventory with a beautiful web dashboard
- **Auto-cleanup** expired items after 7 days
- **Share data** across channels in real-time

All data syncs instantly — add via Telegram, edit on the dashboard, see updates everywhere.

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Telegram account
- Node.js 18+
- Free Cloudflare account
- Free Turso account (cloud SQLite)

### 1️⃣ Create Telegram Bot
```bash
# Open Telegram, find @BotFather
# Send: /newbot
# Name it (e.g., "Food Tracker")
# Note the TOKEN (e.g., 123456:ABC-DEF...)

# Get your Chat ID
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
# Find: "chat":{"id":YOUR_ID}
```

### 2️⃣ Create Turso Database
```bash
turso auth login
turso db create nebula-engine
turso db show nebula-engine --url        # Copy TURSO_URL
turso db tokens create nebula-engine     # Copy TURSO_AUTH_TOKEN
```

### 3️⃣ Clone & Setup
```bash
git clone <repo>
cd nebula-engine
npm install

# Create .env.local
cp .env.example .env.local
# Edit and add:
# TURSO_URL=libsql://nebula-engine-*.turso.io
# TURSO_AUTH_TOKEN=<token>
# TELEGRAM_BOT_TOKEN=<bot-token>
# TELEGRAM_CHAT_ID=<chat-id>
```

### 4️⃣ Deploy Backend
```bash
wrangler login
npm run deploy
# Note Worker URL: https://nebula-engine.<subdomain>.workers.dev
```

### 5️⃣ Set Telegram Webhook
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://nebula-engine.<subdomain>.workers.dev/telegram-webhook"
```

### 6️⃣ Start Dashboard
```bash
cd gui && npm install
npm run dev
# Open http://localhost:3000
```

**Done!** Start sending messages to your bot. 🎉

---

## 📱 How to Use

### Telegram Commands

Send to your bot or any message (will be parsed automatically):

```
chicken 03-07-2026              UK date format (DD-MM-YYYY)
milk 2026-07-03                 ISO format
eggs 3d                         Relative (expires in 3 days)
yogurt july 5                   Natural date
tomato july 5 2026              With year

/list                           Show all items
/remove milk                    Delete item (fuzzy match)
/stats                          Show counts
/cleanup                        Manual expired cleanup
/test                           Send test reminder
/help                           Show all commands
```

**Bulk Add**: Send multiple items on separate lines
```
chicken 03-07-2026
milk 3d
eggs july 5
```

### Dashboard (http://localhost:3000)

📊 **Dashboard Tab**:
- View all items with color-coded expiry dates
- Red alert: Items expiring today
- Dark red alert: Expired items
- Inline edit: Click "Edit", change date, click "Save"
- Inline delete: Click "Delete" with confirmation

📋 **Bulk Add**:
- Paste multiple items (one per line)
- Automatic duplicate detection
- Per-item success/fail feedback

⚙️ **Settings Tab**:
- **Reminder times**: HH:MM format (e.g., `07:00,18:00`)
- **Timezone**: Pick your zone (London, Paris, NY, Tokyo, etc.)
- Auto-saves to database

### Daily Reminders

Every day at your configured times, you receive:
```
🔴 EXPIRING TODAY: chicken, yogurt

🟡 Tomorrow: milk

🟢 In 2 days: eggs
🟢 In 3 days: bread
```

---

## 🏗️ Architecture

```
🌐 Telegram          🌐 Local Dashboard       🌐 Email (optional)
       │                     │                        │
       └─────────────────────┴────────────────────────┘
                             │
                    Cloudflare Workers
                             │
                ┌────────────┴────────────┐
                │                        │
           Turso DB              Telegram Bot API
        (Cloud SQLite)         (Send reminders)
```

**Tech Stack**:
- **Backend**: TypeScript on Cloudflare Workers (serverless)
- **Frontend**: Next.js 16 + React 19 (local dashboard)
- **Database**: Turso (Cloud SQLite, fully replicated)
- **Bot**: Telegram Bot API (webhook-based, instant)
- **Hosting**: Cloudflare Workers (free: 100K req/day)
- **Cost**: $0 (all free tiers)

---

## 📂 Project Structure

```
nebula-engine/
├── src/                              # Cloudflare Worker (Backend)
│   ├── index.ts                      # Entry point, webhook + cron
│   ├── db.ts                         # Turso CRUD client
│   ├── parser.ts                     # Date/input parser
│   ├── telegram.ts                   # Telegram bot wrapper
│   ├── notify.ts                     # Reminder formatter
│   ├── validation.ts                 # Duplicate check, cleanup, stats
│   ├── types.ts                      # TypeScript interfaces
│   └── parser.test.ts                # Unit tests
│
├── gui/                              # Next.js Dashboard (Frontend)
│   ├── app/
│   │   ├── page.tsx                  # Dashboard main
│   │   ├── settings/page.tsx         # Settings page
│   │   ├── layout.tsx                # Root layout
│   │   └── api/
│   │       ├── items/route.ts        # GET/POST items
│   │       ├── items/[id]/route.ts   # PUT/DELETE item
│   │       └── settings/route.ts     # GET/POST settings
│   ├── components/
│   │   ├── navigation.tsx            # Hamburger menu
│   │   ├── item-table.tsx            # Item list with edit/delete
│   │   └── bulk-add.tsx              # Multi-line add form
│   ├── lib/
│   │   ├── db.ts                     # Turso client for GUI
│   │   └── dateUtils.ts              # Date formatting utils
│   └── public/
│       └── background.png            # Nebula theme image
│
├── wrangler.toml                     # Cloudflare config
├── .env.example                      # Environment template
├── package.json                      # Scripts
├── tsconfig.json                     # TypeScript config
└── README.md                         # This file
```

---

## 🔌 API Reference

### Cloudflare Worker Endpoints
- `POST /telegram-webhook` — Telegram message webhook
- `GET /health` — Health check

### Next.js API Routes (localhost:3000)
- `GET /api/items` → Returns `FoodItem[]`
- `POST /api/items` → Create item, returns `{success, duplicate?, error?}`
- `PUT /api/items/{id}` → Update item
- `DELETE /api/items/{id}` → Delete item
- `GET /api/settings` → Fetch settings
- `POST /api/settings` → Save settings

---

## 💾 Database Schema

```sql
-- Items table
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  expiry_date TEXT NOT NULL,           -- ISO 8601: YYYY-MM-DD (internal)
  added_at TEXT DEFAULT (datetime('now')),
  source TEXT NOT NULL                 -- "telegram", "gui"
);

-- Settings/metadata
CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL                  -- reminder_times, timezone, etc.
);
```

---

## ⚙️ Configuration

### Reminder Times
Set in Settings page. Format: `HH:MM` (24-hour), comma-separated.

Examples:
- `07:00,18:00` → 7am & 6pm
- `08:00,20:00` → 8am & 8pm
- `09:00` → 9am only

### Timezone
Dropdown with options:
- Europe/London (GMT/BST)
- Europe/Paris (CET/CEST)
- America/New_York (EST/EDT)
- America/Los_Angeles (PST/PDT)
- UTC
- Asia/Tokyo (JST)
- Australia/Sydney (AEST/AEDT)

### Environment Variables

**Backend** (via `wrangler secret put`):
```
TURSO_URL=libsql://nebula-engine-*.turso.io
TURSO_AUTH_TOKEN=<jwt-token>
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_CHAT_ID=<chat-id>
```

**Frontend** (`.env.local`):
```
TURSO_URL=libsql://nebula-engine-*.turso.io
TURSO_AUTH_TOKEN=<jwt-token>
NEXT_PUBLIC_TURSO_URL=libsql://nebula-engine-*.turso.io
```

---

## 🛠️ Development

### Local Development
```bash
# Terminal 1: Backend (localhost:8787)
npm run dev

# Terminal 2: Dashboard (localhost:3000)
cd gui && npm run dev

# For local Telegram testing, use ngrok:
# ngrok http 8787
# Then set webhook to ngrok URL
```

### Testing
```bash
npm test              # Run parser tests (6 tests)
npm run typecheck     # Type check backend
npm run gui:typecheck # Type check frontend
```

### Deployment
```bash
npm run deploy        # Deploy to Cloudflare Workers
```

---

## 🐛 Troubleshooting

### Telegram not receiving messages
```bash
# Check webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# View logs
wrangler tail

# Resend webhook
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://nebula-engine.<subdomain>.workers.dev/telegram-webhook"
```

### Items not appearing in dashboard
- Check `.env.local` has correct `TURSO_URL` and `TURSO_AUTH_TOKEN`
- Verify API: Open browser console → Network tab → check `/api/items` response
- Turso status: `turso db show nebula-engine`

### Reminders not sending
- Verify items exist: `/stats` in Telegram
- Check cron times in `wrangler.toml`
- Test immediately: `/test` command
- Check Worker logs: `wrangler tail`

### Dashboard slow
- Clear cache: Ctrl+Shift+Delete
- Check Turso status

---

## 📊 Features by Phase

### ✅ Phase 1: MVP
- Telegram webhook integration (instant)
- Date parser (ISO, UK, relative, natural)
- Database schema + CRUD operations
- Daily reminders (8am/7pm UTC)
- Commands: `/list`, `/remove`, `/stats`, `/cleanup`, `/help`, `/test`
- Full test suite (6 tests)

### ✅ Phase 2: Email Channels (Removed)
- Email input/output code removed to focus on Telegram
- Code available in git history if needed

### ✅ Phase 3: Local Management GUI
- Next.js 16 dashboard on localhost:3000
- Item table with inline edit/delete
- Bulk add form (multi-line paste)
- Settings page (reminder times, timezone)
- Color-coded expiry status
- Duplicate detection

### ✅ Phase 4: Polish
- Duplicate detection module
- Auto-cleanup (expired items >7 days old)
- Enhanced Telegram commands
- Validation module
- Bulk add feedback (success/fail counts)
- **UK date format** (DD-MM-YYYY) everywhere
- **Cosmic theme** with hamburger menu
- Glassmorphic navigation
- Colorful buttons + transitions

---

## 💰 Costs

**Completely Free** (all on free tier):
- Cloudflare Workers: 100K requests/day
- Turso: 3 databases, 9GB storage, unlimited reads, 1B writes/month
- Telegram: Free
- GitHub: Free for private repos
- **Total: $0/month**

---

## 🎨 UI/UX Features

- **Cosmic theme**: Dark purple + gold + cyan color scheme
- **Glassmorphic design**: Frosted glass nav bar with blur effect
- **Hamburger menu**: 🍔 emoji that scales & glows on interaction
- **Color-coded items**:
  - 🔴 Red: Expiring today
  - 🟠 Orange: Tomorrow
  - 🟢 Green: Future
  - 🔪 Dark red: Expired
- **Responsive layout**: Works on mobile & desktop
- **Real-time sync**: Changes instantly across channels

---

## 🚀 Future Ideas

- Recurring items (weekly, monthly)
- Item categories (produce, dairy, meat, etc.)
- Recipe suggestions for expiring items
- Notifications via Discord/Slack
- Mobile app (React Native)
- Barcode scanning
- Photo capture for receipts
- Family sharing
- Export to CSV
- Item quantity tracking
- Multi-user accounts

---

## 📚 Commands Reference

```bash
# Development
npm run dev              # Backend (wrangler dev on :8787)
cd gui && npm run dev    # Frontend (Next.js on :3000)

# Testing
npm test                 # Parser tests
npm run typecheck        # Type check backend
npm run gui:typecheck    # Type check GUI

# Building
npm run build            # Build backend
npm run gui:build        # Build frontend

# Deployment
npm run deploy           # Deploy to Cloudflare Workers
wrangler tail            # View live logs
```

---

## 📖 Documentation

- [CLAUDE.md](CLAUDE.md) — Development notes and design decisions
- [Plan](https://github.com/anthropics/claude-code) — Original architecture plan
- [Test Suite](src/parser.test.ts) — Parser test examples

---

## 🔐 Privacy

- All data stored in your Turso database (your control)
- Cloudflare Workers only process requests (no data storage)
- Telegram bot only relays messages (no logging)
- Dashboard is local-only (localhost:3000, no external calls except DB)
- No analytics, no ads, no tracking

---

## 📝 License

Educational / Private Use

---

## 🌟 Tech Stack Summary

| Component | Technology | Why |
|-----------|-----------|-----|
| **Runtime** | Cloudflare Workers | Webhooks + cron, serverless, free |
| **Database** | Turso (Cloud SQLite) | Persistent, replicated, free tier |
| **Frontend** | Next.js 16 + React 19 | Modern, fast, great DX |
| **Bot** | Telegram API | Instant (webhook), free |
| **Deployment** | Cloudflare Workers | Global, free tier, easy |
| **Language** | TypeScript | Type safety, better dev experience |
| **Testing** | Vitest | Fast, simple unit tests |

---

## 🎉 You're All Set!

Start using Nebula Engine:
1. Send a message to your Telegram bot
2. Open http://localhost:3000
3. Enjoy waste-free food management! 🌌

**Questions?** Type `/help` in Telegram for command list.

**Found a bug?** Check [CLAUDE.md](CLAUDE.md) for known issues or create an issue.

Happy tracking! 🍔🌌
