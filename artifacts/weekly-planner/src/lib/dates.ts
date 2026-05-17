import { parseISO } from "date-fns";

/** Parse YYYY-MM-DD at local noon (avoids UTC midnight day-shift bugs). */
export function parseLocalDateStr(dateStr: string): Date {
  return parseISO(`${dateStr}T12:00:00`);
}
