import { ParsedItem } from "./types";

export function parseInput(input: string): ParsedItem | null {
  const trimmed = input.trim();

  if (trimmed.startsWith("/")) {
    return null;
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) {
    return null;
  }

  for (let datePartCount = 1; datePartCount <= 3 && datePartCount < parts.length; datePartCount++) {
    const dateStr = parts.slice(-datePartCount).join(" ");
    const expiryDate = parseDate(dateStr);

    if (expiryDate) {
      const name = parts.slice(0, -datePartCount).join(" ");
      return { name, expiryDate };
    }
  }

  return null;
}

function parseDate(dateStr: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  const d = parseNaturalDate(dateStr);
  if (d) {
    return formatLocalDate(d);
  }

  const daysMatch = dateStr.match(/^(\d+)[dD]$/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatLocalDate(d);
  }

  return null;
}

function parseNaturalDate(dateStr: string): Date | null {
  const months: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  const parts = dateStr.toLowerCase().split(/\s+/);
  if (parts.length < 2) return null;

  const lowerMonth = parts[0];
  const lowerDay = parts[1];

  let month = months[lowerMonth];
  let day = parseInt(lowerDay, 10);

  if (month === undefined || isNaN(day) || day < 1 || day > 31) {
    return null;
  }

  const yearStr = parts[2];
  const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
  if (isNaN(year)) return null;

  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  const isoStr = `${year}-${monthStr}-${dayStr}`;

  return new Date(isoStr);
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
