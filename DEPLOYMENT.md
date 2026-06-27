# Deployment & Setup Guide

Complete step-by-step guide to deploy Nebula Engine from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Service Setup](#service-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Setup](#frontend-setup)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)
- **Telegram Account** — [Download app](https://telegram.org/)
- **Free accounts** (all optional, all free):
  - Cloudflare
  - Turso
  - GitHub (for git)

**Estimated time**: 15-20 minutes

---

## Service Setup

### 1. Create Telegram Bot

#### Steps:
1. Open **Telegram** on your phone or [web.telegram.org](https://web.telegram.org/)
2. Search for **@BotFather** (official Telegram account for bot creation)
3. Send message: `/newbot`
4. BotFather asks for bot name — e.g., `Food Tracker`
5. BotFather asks for username — e.g., `my_food_tracker_bot` (must end with `_bot`)
6. **Copy the bot token** you receive (e.g., `123456:ABC-DEF1234567890`)

#### Get Your Chat ID:
1. Start a chat with your newly created bot (search for the username you chose)
2. Send any message to the bot (e.g., "hello")
3. Get your chat ID by visiting this URL in your browser:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
4. Look for the response with:
   ```json
   {
     "chat": {
       "id": 123456789
     }
   }
   ```
5. **Copy the chat ID** (the number)

**Save for later**:
- Bot Token: `123456:ABC-DEF...`
- Chat ID: `123456789`

---

### 2. Create Turso Database

#### Sign Up:
1. Go to [turso.tech](https://turso.tech)
2. Click "Sign up"
3. Sign in with **GitHub** (easiest)
4. Authorize Turso to access GitHub

#### Create Database:
```bash
# Install Turso CLI
brew install tursodatabase/tap/turso    # macOS
# OR: curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create nebula-engine

# Get database URL
turso db show nebula-engine --url
# Output: libsql://nebula-engine-username.aws-eu-west-1.turso.io

# Create auth token
turso db tokens create nebula-engine
# Output: eyJ0eXA...
```

**Save for later**:
- Database URL: `libsql://nebula-engine-*.turso.io`
- Auth Token: `eyJ0eXA...`

---

### 3. Create Cloudflare Account

#### Sign Up:
1. Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Enter email and create password
3. **Don't add a domain yet** (optional for this project)
4. Free plan is perfect for this project

#### Install Wrangler CLI:
```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
# Opens browser, click "Allow"
```

---

## Backend Deployment

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd nebula-engine
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:
```env
TURSO_URL=libsql://nebula-engine-username.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJ0eXA...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=123456789
```

### 4. Test Backend Locally
```bash
npm run dev
```

You should see:
```
⛅️ wrangler 4.x.x
...
Ready on http://localhost:8787
```

Test the health endpoint:
```bash
curl http://localhost:8787/health
# Output: OK
```

Stop the server (Ctrl+C).

### 5. Add Secrets to Cloudflare

Cloudflare Workers use "secrets" for sensitive data. Add each one:

```bash
wrangler secret put TURSO_URL
# Paste: libsql://nebula-engine-*.turso.io
# Press Enter

wrangler secret put TURSO_AUTH_TOKEN
# Paste: eyJ0eXA...
# Press Enter

wrangler secret put TELEGRAM_BOT_TOKEN
# Paste: 123456:ABC-DEF...
# Press Enter

wrangler secret put TELEGRAM_CHAT_ID
# Paste: 123456789
# Press Enter
```

### 6. Deploy to Cloudflare
```bash
npm run deploy
```

You should see:
```
✅ Uploaded nebula-engine
✅ Deployed nebula-engine triggers
   https://nebula-engine.<your-subdomain>.workers.dev
   schedule: 0 7,18 * * *
```

**Save your Worker URL**: `https://nebula-engine.<subdomain>.workers.dev`

### 7. Set Telegram Webhook

This tells Telegram to send messages to your Cloudflare Worker:

```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://nebula-engine.<your-subdomain>.workers.dev/telegram-webhook"
```

You should get:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

**Test the webhook**:
```bash
# Open Telegram and send a message to your bot
# Try: "chicken 03-07-2026"

# Check if it was received:
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates"
```

---

## Frontend Setup

### 1. Install GUI Dependencies
```bash
cd gui
npm install
cd ..
```

### 2. Create GUI Environment File
```bash
cp .env.example gui/.env.local
```

Edit `gui/.env.local`:
```env
TURSO_URL=libsql://nebula-engine-*.turso.io
TURSO_AUTH_TOKEN=eyJ0eXA...
NEXT_PUBLIC_TURSO_URL=libsql://nebula-engine-*.turso.io
```

### 3. Start Dashboard
```bash
cd gui
npm run dev
```

You should see:
```
▲ Next.js 16.2.9
Local: http://localhost:3000
```

**Open browser**: [http://localhost:3000](http://localhost:3000)

You should see the Nebula Engine dashboard with the hamburger menu! 🍔

---

## Verification

### Test Telegram Bot

1. **Open Telegram** and find your bot (search for the username)
2. **Send test message**:
   ```
   chicken 03-07-2026
   ```
3. **Expect response**:
   ```
   ✅ Added chicken (expires 03-07-2026)
   ```

4. **Test other commands**:
   ```
   /list               → Shows all items
   /stats              → Shows counts
   /remove chicken     → Deletes item
   /test               → Send reminder now
   /help               → Show all commands
   ```

### Test Dashboard

1. **Go to [http://localhost:3000](http://localhost:3000)**
2. **Click Dashboard tab**
3. **Try bulk add**:
   ```
   milk 05-07-2026
   eggs 3d
   yogurt july 5
   ```
4. **Should appear in table** below
5. **Click Edit** on an item → change date → **Click Save**
6. **Click Delete** on an item → confirm
7. **Go to Settings tab**
   - Change reminder times to `08:00,20:00`
   - Pick your timezone
   - Click Save

### Test Reminders

**Option 1: Wait until 8am or 7pm UTC**
- Reminders auto-send at those times
- Adjust in Settings page to test sooner

**Option 2: Trigger immediately**
- Send `/test` command to bot
- You should receive reminder in Telegram

---

## Troubleshooting

### Telegram Bot Not Responding

#### Problem: "Could not parse" error on every message

**Solution**:
1. Check backend is deployed: `npm run deploy`
2. Verify webhook is set:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   # Should show: "url": "https://nebula-engine.*.workers.dev/telegram-webhook"
   ```
3. Check logs:
   ```bash
   wrangler tail
   # Send a message to bot and watch for errors
   ```

#### Problem: Bot doesn't respond at all

**Solution**:
1. Verify bot token is correct:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   # Should return bot info (not 404)
   ```
2. Resend webhook:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://nebula-engine.<subdomain>.workers.dev/telegram-webhook"
   ```
3. Check Cloudflare secrets are set:
   ```bash
   wrangler secret list
   # Should show: TURSO_URL, TURSO_AUTH_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
   ```

---

### Dashboard Not Loading

#### Problem: "Failed to connect" or blank page

**Solution**:
1. Check frontend is running:
   ```bash
   # Terminal should show: "Local: http://localhost:3000"
   # If not, run: cd gui && npm run dev
   ```
2. Check `.env.local` is correct:
   ```bash
   cat gui/.env.local
   # Should have TURSO_URL and TURSO_AUTH_TOKEN
   ```
3. Check browser console for errors:
   - Press F12 → Console tab
   - Look for red errors
   - Common: "TURSO_URL is undefined" → check env file

---

### Database Connection Error

#### Problem: "Failed to fetch items" in dashboard

**Solution**:
1. Verify Turso token is valid:
   ```bash
   turso db show nebula-engine
   # If error: "invalid token", regenerate:
   turso db tokens create nebula-engine
   ```
2. Check Turso URL format:
   ```bash
   echo $TURSO_URL
   # Should be: libsql://nebula-engine-*.turso.io
   # NOT: libsql://nebula-engine-*.turso.io (no trailing slash)
   ```
3. Test database directly:
   ```bash
   turso db shell nebula-engine
   .schema
   SELECT * FROM items;
   ```

---

### Items Not Appearing After Adding

#### Problem: Add confirmation received but item doesn't appear

**Solution**:
1. Check database has item:
   ```bash
   turso db shell nebula-engine
   SELECT * FROM items;
   ```
2. If item exists in DB but not on dashboard:
   - Refresh browser (F5)
   - Check console for API errors
   - Check `/api/items` response: Open DevTools → Network → add item → see response

3. If item doesn't exist in DB:
   - Check `wrangler tail` logs for errors
   - Verify `TURSO_AUTH_TOKEN` in Cloudflare secrets

---

### Reminders Not Sending

#### Problem: `/test` command returns nothing

**Solution**:
1. Verify items exist:
   ```bash
   turso db shell nebula-engine
   SELECT * FROM items WHERE expiry_date >= date('now');
   ```
2. Check cron jobs:
   - Open [dash.cloudflare.com](https://dash.cloudflare.com)
   - Find your Worker
   - Check "Triggers" tab
   - Should show: `0 7,18 * * *` (7am & 6pm UTC)

3. Check logs:
   ```bash
   wrangler tail
   # Wait for cron time or send /test to bot
   ```

4. Verify Telegram API token:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   # Should return bot info, not error
   ```

---

### Duplicate Item Messages

#### Problem: Same item gets added multiple times

**Solution**:
1. Verify duplicate detection is enabled:
   - Backend: `isDuplicate()` in validation.ts should be called
   - Dashboard: API should return `{duplicate: true}`

2. Test manually:
   ```bash
   # Send to Telegram:
   chicken 03-07-2026
   chicken 03-07-2026  # Should say "already tracked"
   ```

3. If still getting duplicates:
   - Check database for rows with same name+date:
     ```bash
     turso db shell nebula-engine
     SELECT name, expiry_date, COUNT(*) FROM items GROUP BY name, expiry_date HAVING COUNT(*) > 1;
     ```
   - If found, manually delete duplicates

---

### Performance Issues

#### Problem: Dashboard is slow

**Solution**:
1. Check network speed:
   - DevTools → Network tab
   - `/api/items` should load in <500ms
   
2. Check Turso status:
   ```bash
   turso db stats nebula-engine
   # Look for "rows" count and "storage" usage
   ```

3. Clear browser cache:
   - Ctrl+Shift+Delete (Windows)
   - Cmd+Shift+Delete (Mac)

---

### Date Format Issues

#### Problem: Dates showing wrong format

**Solution**:
1. Check input format:
   - Telegram: Use `DD-MM-YYYY` (e.g., `chicken 03-07-2026`)
   - Dashboard: Use UK format in text inputs
   - HTML date picker: Automatically converts

2. Check database format:
   ```bash
   turso db shell nebula-engine
   SELECT name, expiry_date FROM items;
   # expiry_date should be ISO: "2026-07-03"
   ```

3. If dates are wrong:
   - Delete items and re-add with correct format
   - Or manually update: `UPDATE items SET expiry_date = '2026-07-03' WHERE id = 1;`

---

## Production Deployment

### Option 1: Keep Dashboard Local (Recommended)
- Keep running `npm run gui:dev` on your computer
- Backend stays on Cloudflare (always live)
- Best for single user

### Option 2: Deploy Dashboard to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from gui directory
cd gui
vercel
# Follow prompts, add env vars (TURSO_URL, TURSO_AUTH_TOKEN)
```

### Option 3: Deploy Dashboard to Netlify

```bash
# Build first
cd gui
npm run build

# Deploy built files to Netlify
netlify deploy --prod --dir=.next
```

---

## Monitoring

### View Cloudflare Worker Logs
```bash
wrangler tail --format json
```

### Monitor Database Usage
```bash
turso db stats nebula-engine
# Shows: rows, storage used, API calls
```

### Check Webhook Status
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | jq
```

---

## Updating

### Update Backend Code
```bash
git pull
npm install  # If new dependencies
npm run deploy
```

### Update Frontend Code
```bash
git pull
cd gui && npm install
npm run dev  # Restart dev server
```

### Update Dependencies
```bash
npm update      # Backend
cd gui && npm update
```

---

## Backing Up Data

### Export Items from Database
```bash
turso db shell nebula-engine
.mode json
SELECT * FROM items;
# Copy output to file
```

### Full Database Export
```bash
turso db dump nebula-engine > backup.sql
```

### Restore from Backup
```bash
turso db shell nebula-engine < backup.sql
```

---

## Security Checklist

- ✅ Don't commit `.env.local` to git (already in `.gitignore`)
- ✅ Keep Telegram bot token secret
- ✅ Keep Turso auth token secret
- ✅ Use Cloudflare secrets (not environment variables) for sensitive data
- ✅ Don't share your chat ID publicly
- ✅ Dashboard is localhost-only (no public access)
- ✅ Regularly update Node.js and dependencies

---

## Getting Help

### Check These First:
1. Read [README.md](README.md) for quick reference
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
3. Check [CLAUDE.md](CLAUDE.md) for developer notes
4. Search `wrangler tail` logs for error messages

### Debug Commands:
```bash
# Test Telegram API
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Check webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# View logs
wrangler tail

# Check Turso
turso db show nebula-engine
turso db stats nebula-engine

# Browser DevTools
F12 → Console, Network, Application tabs
```

---

**You're ready to go!** 🎉 Start by sending your first message to the bot. Enjoy tracking your food with Nebula Engine! 🍔🌌
