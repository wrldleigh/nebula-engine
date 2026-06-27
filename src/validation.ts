import { Database } from "./db";

export async function isDuplicate(
  db: Database,
  name: string,
  expiryDate: string
): Promise<boolean> {
  const items = await db.listItems();
  return items.some(
    (item) =>
      item.name.toLowerCase() === name.toLowerCase() &&
      item.expiry_date === expiryDate
  );
}

export async function cleanupExpiredItems(
  db: Database,
  daysOld: number = 7
): Promise<number> {
  const items = await db.listItems();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  let deletedCount = 0;
  for (const item of items) {
    if (item.expiry_date < cutoffStr) {
      await db.removeItem(item.name);
      deletedCount++;
    }
  }

  return deletedCount;
}

export async function getStats(db: Database): Promise<{
  total: number;
  expiredToday: number;
  expiredThisWeek: number;
  upcoming: number;
}> {
  const items = await db.listItems();
  const today = new Date().toISOString().split("T")[0];
  const weekAhead = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split("T")[0];

  return {
    total: items.length,
    expiredToday: items.filter((i) => i.expiry_date === today).length,
    expiredThisWeek: items.filter(
      (i) => i.expiry_date > today && i.expiry_date <= weekAhead
    ).length,
    upcoming: items.filter((i) => i.expiry_date > weekAhead).length,
  };
}
