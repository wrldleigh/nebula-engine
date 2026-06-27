import { createClient } from "@libsql/client";
import { FoodItem } from "./types";

export class Database {
  private client: ReturnType<typeof createClient>;

  constructor(url: string, token: string) {
    this.client = createClient({
      url,
      authToken: token,
    });
  }

  async init(): Promise<void> {
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        added_at TEXT DEFAULT (datetime('now')),
        source TEXT NOT NULL
      )
    `);
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }

  async addItem(
    name: string,
    expiryDate: string,
    source: "telegram" | "email"
  ): Promise<void> {
    await this.client.execute({
      sql: "INSERT INTO items (name, expiry_date, source) VALUES (?, ?, ?)",
      args: [name, expiryDate, source],
    });
  }

  async listItems(): Promise<FoodItem[]> {
    const result = await this.client.execute(
      "SELECT * FROM items ORDER BY expiry_date ASC"
    );
    return (
      result.rows?.map((row) => ({
        id: row.id as number,
        name: row.name as string,
        expiry_date: row.expiry_date as string,
        added_at: row.added_at as string,
        source: row.source as "telegram" | "email",
      })) || []
    );
  }

  async getExpiringItems(
    withinDays: number = 3
  ): Promise<Map<string, string[]>> {
    const items = await this.listItems();
    const today = new Date().toISOString().split("T")[0];
    const groups: Map<string, string[]> = new Map();

    for (let i = 0; i <= withinDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      groups.set(dateStr, []);
    }

    for (const item of items) {
      if (groups.has(item.expiry_date)) {
        groups.get(item.expiry_date)!.push(item.name);
      }
    }

    return groups;
  }

  async removeItem(name: string): Promise<void> {
    await this.client.execute({
      sql: "DELETE FROM items WHERE LOWER(name) = LOWER(?)",
      args: [name],
    });
  }

  async getMeta(key: string): Promise<string | null> {
    const result = await this.client.execute({
      sql: "SELECT value FROM meta WHERE key = ?",
      args: [key],
    });
    const row = result.rows?.[0];
    return row ? (row.value as string) : null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await this.client.execute({
      sql: "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
      args: [key, value],
    });
  }
}
