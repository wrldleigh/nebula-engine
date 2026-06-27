# Nebula Engine

## Overview
A food expiry tracker that prevents waste. Add items + use-by dates via Telegram or email, receive daily reminders via both channels. Runs on Cloudflare Workers (serverless), stores data in Turso (cloud SQLite). Zero cost — all free tiers.

## Architecture

**Input channels** (async):
- **Telegram webhook**: Instant message receipt via CF Worker
- **Email polling** (Phase 2): Gmail API, checked every 15 min by CF cron

**Processing**:
- Message parser handles: ISO dates (2026-07-03), relative days (3d), natural format (july 3)
- Turso database stores items with expiry date
- CF Worker scheduled jobs run at 8am and 7pm UTC, query DB, format notifications

**Output channels**:
- **Telegram messages**: Via bot API
- **Email** (Phase 2): Via Gmail SMTP

## Phase Status

### Phase 1: Complete
- Telegram webhook integration with instant confirmation replies
- Database schema: `items` (name, expiry_date, source, added_at) + `meta` table
- Parser supports ISO dates, relative days (3d), natural dates (july 3)
- Daily reminders at 8am/7pm (UTC) with color-coded groups (🔴 today, 🟡 tomorrow, 🟢 later)
- Commands: `/list` shows all items, `/remove <name>` deletes
- Full test suite: 6 passing tests covering all date formats

### Phase 2: Email channels (TODO)
- Gmail API polling (every 15 min)
- Gmail SMTP for email reminders

### Phase 3: Local GUI (TODO)
- Next.js dashboard on localhost:3000
- Bulk add/edit/delete
- Settings for reminder times, timezone, toggle notifications
- History view of expired items

### Phase 4: Polish (TODO)
- Duplicate detection
- Auto-cleanup of expired items

## Key Files

**Core**:
- `src/index.ts` — CF Worker entry point, webhook handler, cron scheduler
- `src/db.ts` — Turso database client, CRUD operations
- `src/parser.ts` — Input format parser (ISO, relative, natural dates)
- `src/telegram.ts` — Telegram bot API wrapper
- `src/notify.ts` — Format and send daily reminders
- `wrangler.toml` — CF Worker config with cron triggers

**Tests**:
- `src/parser.test.ts` — 6 tests covering date formats

**Config**:
- `.env.example` — Template for secrets
- `package.json` — Dependencies (@libsql/client, wrangler, tsx, vitest)

## Before Starting Work

1. **Setup required** (see plan):
   - Telegram bot (@BotFather `/newbot`, get token + chat ID)
   - Turso database (`turso db create nebula-engine`, get URL + token)
   - Cloudflare account + `wrangler login`
   - Secrets added via `wrangler secret put`
   - Telegram webhook configured

2. **Deployment**: `npm run deploy`

3. **Local dev**: `npm run dev` starts wrangler on localhost:8787

## Known Future Improvements

- Gmail API polling for email input (Phase 2)
- Gmail SMTP for email reminders (Phase 2)
- Local management GUI with bulk operations (Phase 3)
- Duplicate detection and expired item cleanup (Phase 4)

## Quick Commands

```bash
# Dev server
npm run dev

# Deploy to Cloudflare
npm run deploy

# Type check
npm run typecheck

# Tests
npm test
```

## When to Reach Out

**Telegram webhook not receiving messages?**
- Verify webhook URL is public: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Check CF Worker logs: `wrangler tail`

**Parser not recognizing dates?**
- Test with `npm test` — all formats must pass existing tests
- New formats need tests in `parser.test.ts`

**Reminders not sending?**
- Check DB has items with future expiry dates
- Verify cron times in `wrangler.toml` (7am/6pm UTC = 8am/7pm BST)
