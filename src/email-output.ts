import { GmailConfig } from "./email-input";

export class EmailOutput {
  private config: GmailConfig;
  private fromEmail: string;

  constructor(config: GmailConfig, fromEmail: string) {
    this.config = config;
    this.fromEmail = fromEmail;
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

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const emailContent = [
      `From: ${this.fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      text,
    ].join("\r\n");

    const base64Email = btoa(emailContent).replace(/\+/g, "-").replace(/\//g, "_");

    const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: base64Email,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  }
}

export async function sendReminderEmail(
  output: EmailOutput,
  to: string,
  message: string
): Promise<void> {
  await output.sendEmail(to, "🍔 Food Expiry Reminder", message);
}
