import { addDays, format, startOfWeek } from "date-fns";
import { parseLocalDateStr } from "@/lib/dates";

/** Full week Mon–Sun in week view. */
export const WORKWEEK_LENGTH = 7;

/** Fixed day header height in workweek columns (matches time-rail spacer). */
export const WORKWEEK_DAY_HEADER_HEIGHT = "4.25rem";

/** Fixed focus + tasks panel height — equal across all columns; scrolls inside when needed. */
export const WORKWEEK_SUMMARY_HEIGHT = "9.5rem";

/** Compact summary height below xl (~13" laptops). */
export const WORKWEEK_SUMMARY_HEIGHT_COMPACT = "8rem";

/** Week view: focus/tasks band — matches page canvas above the schedule grid. */
export const WEEK_SUMMARY_SURFACE_CLASS = "bg-canvas dark:bg-card";
export const WEEK_SCHEDULE_SURFACE_CLASS = "bg-surface-subtle";
/** Time-rail spacer above hours — matches page canvas in light, background in dark. */
export const WEEK_RAIL_TOP_SPACER_CLASS = "bg-canvas dark:bg-background";

export function getWorkweekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export interface WorkweekDay {
  date: Date;
  dateStr: string;
}

export function getWorkweekDays(anchorDateStr: string): WorkweekDay[] {
  const anchor = parseLocalDateStr(anchorDateStr);
  const weekStart = getWorkweekStart(anchor);
  return Array.from({ length: WORKWEEK_LENGTH }, (_, i) => {
    const date = addDays(weekStart, i);
    return { date, dateStr: format(date, "yyyy-MM-dd") };
  });
}

export function formatWorkweekRange(days: WorkweekDay[]): string {
  if (days.length === 0) return "";
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const sameMonth = format(first, "MMM") === format(last, "MMM");
  if (sameMonth) {
    return `${format(first, "MMM d")} – ${format(last, "d, yyyy")}`;
  }
  return `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;
}
