import { Database } from "./db";
import { parseInput } from "./parser";
import { processTelegramWebhook, TelegramBot } from "./telegram";
import { sendDailyNotification } from "./notify";
import { EmailInput, processEmailMessages } from "./email-input";
import { isDuplicate, cleanupExpiredItems, getStats } from "./validation";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/telegram-webhook" && request.method === "POST") {
      return handleTelegramWebhook(request, env);
    }

    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const db = new Database(env.TURSO_URL, env.TURSO_AUTH_TOKEN);

    const now = new Date();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();

    // Daily reminders: 8am/7pm UTC (0 7,18 * * *)
    if ((hours === 7 || hours === 18) && minutes < 5) {
      await sendDailyNotification(db, env);

      // Run cleanup at 8am: remove expired items >7 days old
      if (hours === 7) {
        const cleaned = await cleanupExpiredItems(db, 7);
        console.log(`Cleaned up ${cleaned} expired items`);
      }
    }

    // Email polling: every 15 minutes (*/15 * * * *)
    if (minutes % 15 === 0 && env.GMAIL_CLIENT_ID) {
      await pollEmailAndStore(db, env);
    }
  },
};

async function pollEmailAndStore(db: Database, env: Env): Promise<void> {
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || !env.GMAIL_REFRESH_TOKEN) {
    return; // Email not configured
  }

  try {
    const lastPoll = await db.getMeta("last_email_poll");
    const lastTimestamp = lastPoll || new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const emailInput = new EmailInput({
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
    });

    const messages = await emailInput.pollNewMessages(lastTimestamp);

    await processEmailMessages(messages, async (item) => {
      const duplicate = await isDuplicate(db, item.name, item.expiryDate);
      if (!duplicate) {
        await db.addItem(item.name, item.expiryDate, "email");
      }
    });

    await db.setMeta("last_email_poll", new Date().toISOString());
  } catch (error) {
    console.error("Email polling error:", error);
  }
}

async function handleTelegramWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as any;
    const db = new Database(env.TURSO_URL, env.TURSO_AUTH_TOKEN);
    const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);

    const message = body.message;
    if (!message || !message.text) {
      return new Response("OK", { status: 200 });
    }

    const text = message.text.trim();

    if (text.startsWith("/")) {
      const command = text.split(" ")[0];

      if (command === "/list") {
        const items = await db.listItems();
        if (items.length === 0) {
          await bot.sendMessage("📋 No items tracked yet.");
        } else {
          const list = items
            .map(
              (item) =>
                `• *${item.name}* — expires ${item.expiry_date}`
            )
            .join("\n");
          await bot.sendMessage(`📋 *Tracked Items:*\n\n${list}`);
        }
      } else if (command === "/remove") {
        const itemName = text.substring(8).trim();
        if (itemName) {
          await db.removeItem(itemName);
          await bot.sendMessage(`✅ Removed *${itemName}*`);
        } else {
          await bot.sendMessage(`Usage: /remove <item name>`);
        }
      } else if (command === "/stats") {
        const stats = await getStats(db);
        const msg =
          `📊 *Your Stats*\n` +
          `Total items: ${stats.total}\n` +
          `Expiring today: ${stats.expiredToday}\n` +
          `This week: ${stats.expiredThisWeek}\n` +
          `Upcoming: ${stats.upcoming}`;
        await bot.sendMessage(msg);
      } else if (command === "/cleanup") {
        const cleaned = await cleanupExpiredItems(db, 7);
        await bot.sendMessage(
          `🧹 Cleaned up ${cleaned} items (>7 days expired)`
        );
      } else if (command === "/help") {
        const help =
          `*Commands:*\n` +
          `Add item: \`chicken 2026-07-03\` or \`milk 3d\`\n` +
          `/list — Show all items\n` +
          `/remove <name> — Delete item\n` +
          `/stats — Show statistics\n` +
          `/cleanup — Remove expired items >7 days old\n` +
          `/help — Show this message`;
        await bot.sendMessage(help);
      } else {
        await bot.sendMessage(`Unknown command: ${command}. Try /help`);
      }

      return new Response("OK", { status: 200 });
    }

    const parsed = parseInput(text);
    if (parsed) {
      const duplicate = await isDuplicate(db, parsed.name, parsed.expiryDate);
      if (duplicate) {
        await bot.sendMessage(
          `⚠️ *${parsed.name}* with expiry ${parsed.expiryDate} already tracked`
        );
      } else {
        await db.addItem(parsed.name, parsed.expiryDate, "telegram");
        await bot.sendMessage(
          `✅ Added *${parsed.name}* (expires ${parsed.expiryDate})`
        );
      }
    } else {
      await bot.sendMessage(
        `❌ Could not parse. Use format: *item name YYYY-MM-DD* or *item name 3d*, or try /help`
      );
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
}
