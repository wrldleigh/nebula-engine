import { Database } from "./db";
import { parseInput, formatDateUK } from "./parser";
import { processTelegramWebhook, TelegramBot } from "./telegram";
import { sendDailyNotification } from "./notify";
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
    await db.init();

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
  },
};

async function generateRecipePrompt(db: Database, bot: TelegramBot): Promise<void> {
  const expiringGroups = await db.getExpiringItems(10);
  const expiringItems: string[] = [];

  for (const [date, items] of expiringGroups) {
    const today = new Date().toISOString().split("T")[0];
    if (date >= today && items.length > 0) {
      expiringItems.push(...items);
    }
  }

  if (expiringItems.length === 0) {
    await bot.sendMessage(
      `❌ No items expiring in the next 10 days. Add some items first!`
    );
    return;
  }

  const itemList = expiringItems.join(", ");
  const recipePrompt =
    `Here are ingredients I need to use up in the next 10 days:\n\n` +
    `${itemList}\n\n` +
    `I also have the usual pantry staples available:\n` +
    `- Olive oil & cooking oil\n` +
    `- Flour (all-purpose, whole wheat)\n` +
    `- Butter\n` +
    `- Salt, pepper, sugar\n` +
    `- Common herbs & spices (parsley, basil, oregano, cumin, paprika, etc.)\n` +
    `- Pasta, rice\n` +
    `- Eggs\n` +
    `- Various sauces & condiments\n\n` +
    `Please suggest 3-5 recipes that would use these ingredients and help me use them before they expire. Include brief instructions for each.\n\n` +
    `If you don't have many interesting options with just these ingredients, ask me if I have any other ingredients available (like fresh vegetables, proteins, dairy, etc.) that might open up more possibilities.`;

  const message =
    `🍳 *Recipe Ideas (10-day expiry)*\n\n` +
    `Copy the prompt below and paste it into Claude, ChatGPT, or your favourite LLM to get recipe ideas:\n\n` +
    `\`\`\`\n${recipePrompt}\n\`\`\``;

  await bot.sendMessage(message);
}

async function handleTelegramWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as any;
    const db = new Database(env.TURSO_URL, env.TURSO_AUTH_TOKEN);
    await db.init();
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
                `• *${item.name}* — expires ${formatDateUK(item.expiry_date)}`
            )
            .join("\n");
          await bot.sendMessage(`📋 *Tracked Items:*\n\n${list}`);
        }
      } else if (command === "/remove") {
        const itemName = text.substring(8).trim();
        if (itemName) {
          const allItems = await db.listItems();
          const matching = allItems.filter(item =>
            item.name.toLowerCase().includes(itemName.toLowerCase())
          );
          if (matching.length === 0) {
            await bot.sendMessage(`❌ No items matching *${itemName}* found.`);
          } else if (matching.length === 1) {
            await db.removeItem(matching[0].name);
            await bot.sendMessage(`✅ Removed *${matching[0].name}*`);
          } else {
            const list = matching.map(item => `• ${item.name}`).join("\n");
            await bot.sendMessage(
              `Multiple matches found:\n${list}\n\nPlease be more specific.`
            );
          }
        } else {
          const allItems = await db.listItems();
          if (allItems.length === 0) {
            await bot.sendMessage(`No items to remove.`);
          } else {
            const list = allItems.map(item => `• ${item.name}`).join("\n");
            await bot.sendMessage(`*Remove which item?*\n${list}\n\nReply: /remove <item name>`);
          }
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
      } else if (command === "/recipes") {
        await generateRecipePrompt(db, bot);
      } else if (command === "/test") {
        await sendDailyNotification(db, env);
      } else if (command === "/help") {
        const help =
          `*📝 How to add items:*\n` +
          `chicken 03-07-2026 (exact date: DD-MM-YYYY)\n` +
          `milk 3d (expires in 3 days)\n` +
          `yogurt july 5 (natural date)\n` +
          `Send multiple items on separate lines for bulk add\n\n` +
          `*Commands:*\n` +
          `/list — Show all items\n` +
          `/remove <name> — Delete item (shows matches)\n` +
          `/stats — Show statistics\n` +
          `/cleanup — Remove expired items >7 days old\n` +
          `/recipes — Generate LLM prompt for recipe ideas\n` +
          `/test — Send a test reminder now\n` +
          `/help — Show this message`;
        await bot.sendMessage(help);
      } else {
        await bot.sendMessage(`Unknown command: ${command}. Try /help`);
      }

      return new Response("OK", { status: 200 });
    }

    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    let addedCount = 0;
    let skippedCount = 0;
    let failedLines: string[] = [];

    for (const line of lines) {
      const parsed = parseInput(line);
      if (parsed) {
        const expiryDate = new Date(parsed.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          failedLines.push(`${parsed.name}: expires in past (${formatDateUK(parsed.expiryDate)})`);
        } else {
          const duplicate = await isDuplicate(db, parsed.name, parsed.expiryDate);
          if (duplicate) {
            skippedCount++;
          } else {
            await db.addItem(parsed.name, parsed.expiryDate, "telegram");
            addedCount++;
          }
        }
      } else {
        failedLines.push(`Could not parse: ${line}`);
      }
    }

    let response = "";
    if (addedCount > 0) {
      response += `✅ Added ${addedCount} items`;
    }
    if (skippedCount > 0) {
      response += `${response ? ", " : ""}⏭️ Skipped ${skippedCount} duplicates`;
    }
    if (failedLines.length > 0) {
      response += `${response ? "\n" : ""}❌ Failed:\n${failedLines.map(f => `• ${f}`).join("\n")}`;
    }

    if (response) {
      await bot.sendMessage(response);
    } else {
      await bot.sendMessage(
        `❌ Could not parse. Try:\n` +
        `• chicken 03-07-2026\n` +
        `• milk 3d\n` +
        `• yogurt july 5\n\n` +
        `Or type /help for details.`
      );
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
}
