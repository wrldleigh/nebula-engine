import { createClient } from "@libsql/client";

export interface FoodItem {
  id: number;
  name: string;
  expiry_date: string;
  added_at: string;
  source: string;
}

export interface Settings {
  reminder_times?: string;
  timezone?: string;
  telegram_enabled?: string;
  email_enabled?: string;
}

let dbClient: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!dbClient) {
    const url = process.env.NEXT_PUBLIC_TURSO_URL || process.env.TURSO_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    if (!url || !token) {
      throw new Error("Missing TURSO_URL or TURSO_AUTH_TOKEN");
    }

    dbClient = createClient({
      url,
      authToken: token,
    });
  }
  return dbClient;
}

export async function listItems(): Promise<FoodItem[]> {
  const client = getClient();
  const result = await client.execute(
    "SELECT * FROM items ORDER BY expiry_date ASC"
  );

  return (
    result.rows?.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      expiry_date: row.expiry_date as string,
      added_at: row.added_at as string,
      source: row.source as string,
    })) || []
  );
}

export async function addItem(
  name: string,
  expiryDate: string,
  source: string = "gui"
): Promise<void> {
  const client = getClient();
  await client.execute({
    sql: "INSERT INTO items (name, expiry_date, source) VALUES (?, ?, ?)",
    args: [name, expiryDate, source],
  });
}

export async function updateItem(
  id: number,
  name: string,
  expiryDate: string
): Promise<void> {
  const client = getClient();
  const numId = Number(id);
  if (isNaN(numId)) {
    throw new Error(`Invalid id: ${id}`);
  }
  await client.execute({
    sql: "UPDATE items SET name = ?, expiry_date = ? WHERE id = ?",
    args: [name, expiryDate, numId],
  });
}

export async function deleteItem(id: number): Promise<void> {
  const client = getClient();
  const numId = Number(id);
  if (isNaN(numId)) {
    throw new Error(`Invalid id: ${id}`);
  }
  await client.execute({
    sql: "DELETE FROM items WHERE id = ?",
    args: [numId],
  });
}

export async function getSettings(key: string): Promise<string | null> {
  const client = getClient();
  const result = await client.execute({
    sql: "SELECT value FROM meta WHERE key = ?",
    args: [key],
  });
  const row = result.rows?.[0];
  return row ? (row.value as string) : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const client = getClient();
  await client.execute({
    sql: "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
    args: [key, value],
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const client = getClient();
  const result = await client.execute("SELECT key, value FROM meta");

  const settings: Record<string, string> = {};
  result.rows?.forEach((row) => {
    settings[row.key as string] = row.value as string;
  });

  return settings;
}
