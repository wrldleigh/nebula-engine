import { Env } from "./types";

export class TelegramBot {
  private botToken: string;
  private chatId: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  async sendMessage(text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  }

  async handleWebhook(body: any): Promise<{
    command?: string;
    text?: string;
  }> {
    const message = body.message;
    if (!message || !message.text) {
      return {};
    }

    const text = message.text.trim();

    if (text.startsWith("/")) {
      return { command: text.split(" ")[0] };
    }

    return { text };
  }
}

export async function processTelegramWebhook(
  body: any,
  env: Env
): Promise<{
  command?: string;
  text?: string;
  error?: string;
}> {
  try {
    const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
    return await bot.handleWebhook(body);
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return { error: String(error) };
  }
}
