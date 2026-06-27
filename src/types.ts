export interface FoodItem {
  id: number;
  name: string;
  expiry_date: string; // ISO 8601: "2026-07-03"
  added_at: string;
  source: "telegram" | "email";
}

export interface ParsedItem {
  name: string;
  expiryDate: string; // ISO 8601
}

export interface ExpiryGroup {
  category: "today" | "tomorrow" | "2days" | "3days";
  items: string[];
}

export interface Env {
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  // Phase 2: Email
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;
  GMAIL_FROM_EMAIL?: string;
  GMAIL_TO_EMAIL?: string;
}
