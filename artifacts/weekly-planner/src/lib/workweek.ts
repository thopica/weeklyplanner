import { addDays, format, parseISO, startOfWeek } from "date-fns";

/** Full week Mon–Sun in week view. */
export const WORKWEEK_LENGTH = 7;

/** Fixed day header height in workweek columns (matches time-rail spacer). */
export const WORKWEEK_DAY_HEADER_HEIGHT = "4.25rem";

/** Fixed focus + tasks panel height — equal across all columns; scrolls inside when needed. */
export const WORKWEEK_SUMMARY_HEIGHT = "9.5rem";

/** Week view: focus/tasks vs schedule (calendar) surfaces. */
export const WEEK_SUMMARY_SURFACE_CLASS = "bg-card";
export const WEEK_SCHEDULE_SURFACE_CLASS = "bg-surface-subtle";
/** Time-rail spacer above hours — matches page background (#F4F1EA on default theme). */
export const WEEK_RAIL_TOP_SPACER_CLASS = "bg-background";

export function getWorkweekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export interface WorkweekDay {
  date: Date;
  dateStr: string;
}

/** Parse YYYY-MM-DD at local noon (avoids UTC day-shift bugs). */
function parseLocalDateStr(dateStr: string): Date {
  return parseISO(`${dateStr}T12:00:00`);
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
