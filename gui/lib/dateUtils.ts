export function formatDateUK(isoDate: string): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

export function formatDateISO(ukDate: string): string {
  if (!ukDate) return "";
  const parts = ukDate.split("-");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

export function isoToHtmlDateInput(isoDate: string): string {
  // HTML date input needs YYYY-MM-DD format
  return isoDate;
}

export function htmlDateInputToISO(htmlDate: string): string {
  // HTML date input is already in YYYY-MM-DD format
  return htmlDate;
}
