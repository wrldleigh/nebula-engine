import { Database } from "./db";
import { TelegramBot } from "./telegram";
import { formatDateUK } from "./parser";
import { Env } from "./types";

export function formatExpiryMessage(expiringGroups: Map<string, string[]>): string {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const in2days = new Date(Date.now() + 172800000).toISOString().split("T")[0];
  const in3days = new Date(Date.now() + 259200000).toISOString().split("T")[0];

  let message = "";

  const todayItems = expiringGroups.get(today) || [];
  if (todayItems.length > 0) {
    message += `🔴 *EXPIRING TODAY:* ${todayItems.join(", ")}\n\n`;
  }

  const tomorrowItems = expiringGroups.get(tomorrow) || [];
  if (tomorrowItems.length > 0) {
    message += `🟡 *Tomorrow:* ${tomorrowItems.join(", ")}\n`;
  }

  const in2daysItems = expiringGroups.get(in2days) || [];
  if (in2daysItems.length > 0) {
    message += `🟢 *In 2 days:* ${in2daysItems.join(", ")}\n`;
  }

  const in3daysItems = expiringGroups.get(in3days) || [];
  if (in3daysItems.length > 0) {
    message += `🟢 *In 3 days:* ${in3daysItems.join(", ")}\n`;
  }

  if (!message) {
    message = "✅ No items expiring in the next 3 days!";
  }

  return message;
}

export async function sendDailyNotification(db: Database, env: Env): Promise<void> {
  const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
  const expiringGroups = await db.getExpiringItems(3);
  const message = formatExpiryMessage(expiringGroups);
  await bot.sendMessage(message);
}
