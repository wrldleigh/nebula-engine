import { parseInput } from "./parser";

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export class EmailInput {
  private config: GmailConfig;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = (await response.json()) as any;
    if (!data.access_token) {
      throw new Error("Failed to get Gmail access token");
    }
    return data.access_token;
  }

  async pollNewMessages(lastTimestamp: string): Promise<Array<{ text: string; timestamp: string }>> {
    const accessToken = await this.getAccessToken();
    const query = `from:${this.config.clientId} after:${lastTimestamp}`;

    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = (await response.json()) as any;
    const messages = data.messages || [];

    const results = [];
    for (const msg of messages) {
      const msgData = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const msgContent = (await msgData.json()) as any;
      const headers = msgContent.payload.headers || [];
      const subjectHeader = headers.find((h: any) => h.name === "Subject");
      const subject = subjectHeader?.value || "";

      results.push({
        text: subject,
        timestamp: new Date(parseInt(msgContent.internalDate)).toISOString(),
      });
    }

    return results;
  }
}

export async function processEmailMessages(
  messages: Array<{ text: string; timestamp: string }>,
  onItem: (item: { name: string; expiryDate: string }) => Promise<void>
): Promise<void> {
  for (const msg of messages) {
    const parsed = parseInput(msg.text);
    if (parsed) {
      await onItem(parsed);
    }
  }
}
