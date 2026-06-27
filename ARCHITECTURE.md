# Architecture & Design Documentation

## System Overview

Nebula Engine is a distributed food expiry tracker with three main components:

1. **Backend** (Cloudflare Workers) — Serverless webhook + cron handler
2. **Frontend** (Next.js Dashboard) — Local management UI
3. **Database** (Turso) — Cloud SQLite for data persistence

```
┌─────────────────────────────────────────────────────────┐
│                    Input Sources                         │
├──────────────┬──────────────────────┬──────────────────┤
│  Telegram    │  Dashboard           │  Email (Phase 2) │
│  Bot         │  (React Component)   │  API             │
└──────────────┴──────────┬───────────┴──────────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │  Cloudflare Workers          │
           │  ┌────────────────────────┐  │
           │  │ Request Handler        │  │
           │  │ • Parse input          │  │
           │  │ • Validate             │  │
           │  │ • Store in DB          │  │
           │  └────────────────────────┘  │
           │  ┌────────────────────────┐  │
           │  │ Scheduled Tasks (Cron) │  │
           │  │ • Query expiring items │  │
           │  │ • Format messages      │  │
           │  │ • Send reminders       │  │
           │  └────────────────────────┘  │
           └──────────────┬───────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │  Turso Database              │
           │  ├─ items table              │
           │  └─ meta table               │
           └──────────────────────────────┘
                          ▲
                          │
           ┌──────────────┴───────────────┐
           │                              │
           ▼                              ▼
      Telegram API              Next.js API Routes
      (Send reminders)          (List, Add, Edit, Delete)
```

---

## Backend Architecture (Cloudflare Workers)

### Entry Point: `src/index.ts`

The Worker handles two types of events:

#### 1. HTTP Requests (Webhook)
```
POST /telegram-webhook
  └─ body: Telegram update
     └─ handleTelegramWebhook()
        ├─ Extract message
        ├─ Parse input
        ├─ Check for commands
        ├─ Validate/Process
        └─ Store in DB + Send response
```

**Flow**:
1. Telegram sends webhook when user messages bot
2. Cloudflare Worker receives POST request
3. Handler extracts message text
4. Parser identifies format (ISO, UK, relative, natural)
5. Duplicate check prevents re-adding
6. Insert into `items` table or execute command
7. Send confirmation via Telegram API

#### 2. Scheduled Jobs (Cron)
```
Scheduled Event (7am UTC)
  └─ sendDailyNotification()
     ├─ Query DB: items expiring next 3 days
     ├─ Group by date
     ├─ Format message (🔴🟡🟢)
     └─ Send via Telegram API

Scheduled Event (7am UTC)
  └─ cleanupExpiredItems()
     ├─ Query DB: items > 7 days expired
     ├─ Delete rows
     └─ Log count
```

**Cron Config** (in `wrangler.toml`):
```toml
[triggers]
crons = ["0 7,18 * * *"]  # 7am & 6pm UTC
```

### Parser Logic: `src/parser.ts`

Converts multiple date formats into ISO 8601 (YYYY-MM-DD):

```
Input: "chicken 03-07-2026"
  ↓
parseInput() splits on whitespace
  ↓
Try parseDate() on "03-07-2026"
  ├─ ISO format YYYY-MM-DD? ✗
  ├─ UK format DD-MM-YYYY? ✓ → "2026-07-03"
  └─ Natural date? 
  └─ Relative days?

Return: {name: "chicken", expiryDate: "2026-07-03"}
```

**Supported Formats**:
- `ISO`: `2026-07-03` (YYYY-MM-DD)
- `UK`: `03-07-2026` (DD-MM-YYYY)
- `Relative`: `3d` (days from now)
- `Natural`: `july 5`, `july 5 2026` (month + day + optional year)

**Implementation**:
1. `parseInput()` — Splits text, tries date parsing with up to 3 trailing tokens as the date
2. `parseDate()` — Tests each format regex
3. `parseNaturalDate()` — Converts month name to number
4. `formatLocalDate()` — Returns ISO string
5. `formatDateUK()` — Converts ISO to DD-MM-YYYY for display

### Database Layer: `src/db.ts`

**Turso Client Initialization**:
```typescript
createClient({
  url: env.TURSO_URL,              // libsql://...
  authToken: env.TURSO_AUTH_TOKEN  // JWT token
})
```

**Core Operations**:

| Method | SQL | Purpose |
|--------|-----|---------|
| `init()` | CREATE TABLE IF NOT EXISTS | Setup schema on first run |
| `addItem()` | INSERT INTO items | Store new item |
| `listItems()` | SELECT * FROM items ORDER BY expiry_date | Fetch all |
| `getExpiringItems(days)` | SELECT with date grouping | Group by expiry |
| `removeItem(name)` | DELETE WHERE LOWER(name) = | Case-insensitive delete |
| `getMeta(key)` | SELECT FROM meta | Fetch setting |
| `setMeta(key, val)` | INSERT OR REPLACE INTO meta | Store setting |

**Transaction Safety**:
- Each operation is atomic (SQL handles ACID)
- Duplicate check is read-then-write (OK because Telegram is single-threaded)
- Concurrent writes from multiple channels (Telegram, GUI, email) are safe due to DB locking

### Telegram Integration: `src/telegram.ts`

**Bot Class**:
```typescript
class TelegramBot {
  constructor(token: string, chatId: string)
  sendMessage(text: string)  // POST to Telegram API
}
```

**API Call**:
```
POST https://api.telegram.org/bot{TOKEN}/sendMessage
{
  chat_id: CHAT_ID,
  text: message,
  parse_mode: "Markdown"
}
```

**Markdown Support**:
- `*text*` → bold
- `_text_` → italic
- Code blocks with backticks

### Notification Formatting: `src/notify.ts`

**Daily Reminder Generation**:
```
getExpiringItems(3 days)
  ↓
Group items by date:
  {
    "2026-06-27": ["chicken", "milk"],
    "2026-06-28": ["yogurt"],
    "2026-06-29": ["eggs"],
    "2026-06-30": ["bread"]
  }
  ↓
Format message:
  🔴 EXPIRING TODAY: chicken, milk
  
  🟡 Tomorrow: yogurt
  
  🟢 In 2 days: eggs
  🟢 In 3 days: bread
  ↓
Send via Telegram API
```

### Validation Module: `src/validation.ts`

**Duplicate Detection**:
```typescript
isDuplicate(db, name, expiryDate)
  ├─ Query: SELECT FROM items WHERE LOWER(name) = ? AND expiry_date = ?
  └─ Return: boolean
```

**Stats Calculation**:
```typescript
getStats(db)
  ├─ Total: COUNT(*)
  ├─ Expiring Today: WHERE expiry_date = TODAY
  ├─ This Week: WHERE expiry_date BETWEEN TODAY AND TODAY+7
  └─ Upcoming: WHERE expiry_date > TODAY+7
```

**Cleanup**:
```typescript
cleanupExpiredItems(db, daysOld=7)
  ├─ Query: DELETE WHERE expiry_date < (TODAY - daysOld)
  └─ Return: count deleted
```

---

## Frontend Architecture (Next.js)

### Page Structure

```
gui/app/
├── layout.tsx              (Server Component)
│   └─ <Navigation />       (Client Component with hamburger)
│       └─ <main>{children}</main>
├── page.tsx                (Client Component)
│   ├─ <BulkAdd onAdd={} />
│   └─ <ItemTable items={} onRefresh={} />
└── settings/page.tsx       (Client Component)
    ├─ Reminder Times Input
    ├─ Timezone Select
    └─ Save Button
```

### Data Flow

```
Dashboard Load
  ↓
useEffect(() => { fetch('/api/items') })
  ↓
items state = [FoodItem, FoodItem, ...]
  ↓
Render <ItemTable items={items} />
  │
  └─ User edits item
     │
     └─ PUT /api/items/123 { name, expiryDate }
        └─ onRefresh() re-fetches
           └─ UI updates
```

### API Routes (Next.js)

**GET /api/items**:
```
Request: None
  ↓
database.listItems()
  ↓
Response: FoodItem[]
```

**POST /api/items**:
```
Request: { name, expiryDate }
  ↓
Validate: name + date required
  ↓
Check: isDuplicate?
  ├─ Yes: Response { success: true, duplicate: true }
  └─ No:
     └─ Validate: expiryDate not in past?
        ├─ Yes (past): Response { error: "..." }
        └─ No (future):
           └─ INSERT item
              └─ Response { success: true, duplicate: false }
```

**PUT /api/items/[id]**:
```
Request: { name, expiryDate }
  ↓
Validate: Both required
  ↓
Validate: expiryDate not in past
  ├─ Yes: Response { error: "..." }
  └─ No: UPDATE item → Response { success: true }
```

**DELETE /api/items/[id]**:
```
Request: None
  ↓
DELETE FROM items WHERE id = ?
  ↓
Response: { success: true }
```

### Component Architecture

#### ItemTable (`item-table.tsx`)
- **Props**: `items: FoodItem[]`, `onRefresh: () => void`
- **State**: `editingId`, `editName`, `editDate`, `error`
- **Features**:
  - Display with color-coded expiry
  - Inline edit mode
  - Save/Cancel buttons
  - Delete with confirmation
  - Error display

#### BulkAdd (`bulk-add.tsx`)
- **Props**: `onAdd: () => void`
- **State**: `text`, `isLoading`, `message`, `message_type`
- **Features**:
  - Multi-line textarea
  - Per-line parsing
  - Duplicate detection
  - Success/error feedback
  - Auto-dismiss on success

#### Navigation (`navigation.tsx`)
- **State**: `isOpen` (menu open/close)
- **Features**:
  - Hamburger menu (🍔)
  - Animated lines (rotate/fade)
  - Dropdown menu with links
  - Hover effects

### Date Handling in GUI

**Internal Storage**: ISO format (YYYY-MM-DD)
**Display Format**: UK format (DD-MM-YYYY)
**HTML Input**: ISO format (YYYY-MM-DD)

**Conversion Functions** (`lib/dateUtils.ts`):
```typescript
formatDateUK("2026-07-03")        // → "03-07-2026"
formatDateISO("03-07-2026")       // → "2026-07-03"
isoToHtmlDateInput("2026-07-03")  // → "2026-07-03" (identity)
```

---

## Data Models

### FoodItem
```typescript
interface FoodItem {
  id: number;
  name: string;
  expiry_date: string;        // ISO 8601: "2026-07-03"
  added_at: string;           // "2026-06-27T14:30:00"
  source: "telegram" | "gui";  // Where it came from
}
```

### ParsedItem (Internal)
```typescript
interface ParsedItem {
  name: string;
  expiryDate: string;  // ISO 8601: "2026-07-03"
}
```

### Settings
```typescript
interface Settings {
  reminder_times?: string;  // "07:00,18:00"
  timezone?: string;        // "Europe/London"
}
```

---

## Security Considerations

### Input Validation
- ✅ Date format validation (regex checks)
- ✅ Past date rejection (can't add expired items)
- ✅ Item name length (reasonable limits)
- ✅ Duplicate detection (prevents spam)

### Data Protection
- ✅ Database tokens stored in Cloudflare secrets (not code)
- ✅ Environment variables in `.env.local` (git-ignored)
- ✅ Telegram chat ID is your personal identifier
- ✅ No PII stored (only item names + dates)

### API Security
- ✅ Telegram webhook validates requests (via CF Workers)
- ✅ All API routes require correct DB credentials
- ✅ No authentication needed (local-only dashboard)
- ✅ HTTPS enforced by Cloudflare

### Limitations
- ⚠️ Telegram API tokens must be kept secret
- ⚠️ Dashboard is localhost-only (no remote access)
- ⚠️ No rate limiting (assumes single user)

---

## Performance Considerations

### Database
- Turso auto-scales reads (unlimited free tier)
- Cron jobs run once per day (minimal cost)
- Webhook processes instantly (avg <100ms)
- No N+1 queries (single fetch per request)

### Frontend
- Next.js uses code splitting
- API routes are stateless
- Client-side filtering/sorting (no DB calls)
- Background image is cached by browser

### Optimization Opportunities
1. Cache items locally (IndexedDB)
2. Lazy-load dashboard on scroll
3. Batch API requests
4. Compress responses with gzip

---

## Error Handling

### Backend
- **Parse errors**: Return helpful message with examples
- **DB errors**: Log and return generic "failed" message
- **Telegram API errors**: Log, retry once, skip if fails

### Frontend
- **API errors**: Display in inline error box with retry button
- **Validation errors**: Show field-level feedback
- **Network errors**: Show "connection error, check network"

---

## Testing Strategy

### Unit Tests (`src/parser.test.ts`)
- ✅ ISO date parsing
- ✅ UK date parsing (DD-MM-YYYY)
- ✅ Relative days (3d)
- ✅ Natural dates (july 5)
- ✅ Multi-word names
- ✅ Command rejection (/list, etc.)

### Manual Testing
- Send items via Telegram
- Edit in dashboard
- View reminders
- Test commands (/list, /remove, /stats, /cleanup, /test)
- Check timezone settings
- Bulk add with duplicates

### Integration Testing
- Item flows across channels
- Settings persist
- Cron jobs execute
- Email (Phase 2) when enabled

---

## Deployment Architecture

### Cloudflare Workers
```
git push
  ↓
GitHub Actions (optional)
  ↓
npm run deploy
  ↓
wrangler publish
  ↓
Cloudflare edge network
  ├─ US
  ├─ EU
  ├─ APAC
  └─ ~250+ locations
```

### Dashboard Deployment Options
1. **Local** (development): `npm run dev` on localhost:3000
2. **Vercel** (production): `vercel deploy`
3. **Netlify** (production): `netlify deploy`
4. **Self-hosted** (VPS): `npm run build && npm start`

### Database
- Turso is always cloud-hosted
- Automatic replication across regions
- Daily automated backups
- Point-in-time recovery available

---

## Scaling Considerations

**Current Limits**:
- 1 user (single chat ID)
- Telegram rate limits: ~30 messages/sec
- Turso free tier: 9GB storage, 1B writes/month

**To Support Multiple Users**:
1. Add user authentication
2. Namespace items by user_id
3. Create separate Telegram bots per user
4. Add pagination to item queries
5. Implement caching layer

---

## Future Architectural Changes

### Phase 2 (Email) - Removed for Focus
- Gmail API integration
- Email polling every 15 min
- SMTP sending for reminders

### Potential Enhancements
1. **WebSocket support** for real-time updates
2. **GraphQL API** instead of REST
3. **Redis caching** for frequently accessed items
4. **Message queue** for reliability (Bull, RabbitMQ)
5. **Analytics** (anonymous usage patterns)
6. **Rate limiting** per user
7. **Audit logging** of changes

---

## Monitoring & Debugging

### Cloudflare Workers Logs
```bash
wrangler tail --format json
```

### Turso Database Monitoring
```bash
turso db stats nebula-engine
turso db shell nebula-engine
```

### Frontend Debugging
- Browser DevTools (Network, Console, Storage)
- Next.js debug mode: `NODE_DEBUG=* npm run dev`
- React DevTools browser extension

---

This architecture is designed for:
- ✅ Simplicity (single-user, serverless, free)
- ✅ Reliability (cloud SQLite, auto-scaling)
- ✅ Fast iteration (TypeScript, testing)
- ✅ Easy maintenance (clear separation of concerns)
- ✅ Future growth (modular, extensible design)
