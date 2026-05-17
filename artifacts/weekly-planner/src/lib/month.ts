import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { parseLocalDateStr } from "@/lib/dates";

/** Fixed day header height in month cells (aligned with workweek). */
export const MONTH_DAY_HEADER_HEIGHT = "4.25rem";

/** Fixed task panel height — equal across all day cells; scrolls inside when needed. */
export const MONTH_CELL_TASK_HEIGHT = "9.5rem";

export const MONTH_WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

export interface MonthGridCell {
  dateStr: string;
  inMonth: boolean;
}

/** All cells for the month grid: pad to full Mon–Sun weeks (5–6 rows × 7 cols). */
export function getMonthGrid(anchorDateStr: string): MonthGridCell[] {
  const anchor = parseLocalDateStr(anchorDateStr);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const anchorMonth = format(anchor, "yyyy-MM");

  const cells: MonthGridCell[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const dateStr = format(cursor, "yyyy-MM-dd");
    cells.push({
      dateStr,
      inMonth: format(cursor, "yyyy-MM") === anchorMonth,
    });
    cursor = addDays(cursor, 1);
  }
  return cells;
}

export function getMonthGridRows(cells: MonthGridCell[]): MonthGridCell[][] {
  const rows: MonthGridCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function formatMonthTitle(anchorDateStr: string): string {
  return format(parseLocalDateStr(anchorDateStr), "MMMM yyyy");
}

export function addMonthsAnchor(dateStr: string, delta: number): string {
  return format(addMonths(parseLocalDateStr(dateStr), delta), "yyyy-MM-dd");
}

export function isCurrentMonth(anchorDateStr: string): boolean {
  const today = format(new Date(), "yyyy-MM-dd");
  return format(parseLocalDateStr(anchorDateStr), "yyyy-MM") === format(parseLocalDateStr(today), "yyyy-MM");
}
