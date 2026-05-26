import { addDays, format } from "date-fns";
import type { CalendarEvent } from "./types";
import { isMultiDayEvent } from "./events";
import { parseLocalDateStr } from "./dates";
import type { MonthGridCell } from "./month";

export interface MultiDaySegment {
  eventId: string;
  /** Lane index this segment occupies within the row (0-based). */
  lane: number;
  /** True for the leftmost cell of this segment in the current week row. */
  isLeftEdge: boolean;
  /** True for the rightmost cell of this segment in the current week row. */
  isRightEdge: boolean;
  /** True if this cell is the actual event's start day (only ever true at left edge). */
  isEventStart: boolean;
  /** True if this cell is the actual event's last day (only ever true at right edge). */
  isEventEnd: boolean;
}

export interface RowLanes {
  /** Number of lanes used by multi-day bands in this row (>= 0). */
  maxLanes: number;
  /** Per-cell ordered segments keyed by dateStr. */
  cells: Map<string, MultiDaySegment[]>;
}

/** Day strings are ISO YYYY-MM-DD; lexicographic compare matches chronological order. */
function lastCoveredDay(event: CalendarEvent): string {
  const startDate = event.startsAt.slice(0, 10);
  let endDate = event.endsAt.slice(0, 10);
  // All-day events store endsAt as the next day's midnight; treat the day before as the last covered day.
  if (event.allDay && event.endsAt.slice(11, 19) === "00:00:00" && endDate > startDate) {
    endDate = format(addDays(parseLocalDateStr(endDate), -1), "yyyy-MM-dd");
  }
  // For timed events ending exactly at next-day 00:00:00, also clip.
  if (!event.allDay && event.endsAt.slice(11, 19) === "00:00:00" && endDate > startDate) {
    endDate = format(addDays(parseLocalDateStr(endDate), -1), "yyyy-MM-dd");
  }
  return endDate;
}

/**
 * Core lane builder. Caller pre-filters which events participate (e.g. only
 * multi-day events for month bands, or all all-day events for the week strip).
 */
function assignLanes(
  events: CalendarEvent[],
  dateStrs: string[],
): RowLanes {
  if (dateStrs.length === 0) return { maxLanes: 0, cells: new Map() };
  const rowStart = dateStrs[0];
  const rowEnd = dateStrs[dateStrs.length - 1];

  interface RawSegment {
    event: CalendarEvent;
    startCol: number;
    endCol: number;
    eventStartDate: string;
    eventEndDate: string;
  }
  const segs: RawSegment[] = [];
  for (const e of events) {
    const eStart = e.startsAt.slice(0, 10);
    const eEnd = lastCoveredDay(e);
    if (eEnd < rowStart || eStart > rowEnd) continue;
    const startCol = dateStrs.findIndex((d) => d >= eStart);
    let endCol = -1;
    for (let i = dateStrs.length - 1; i >= 0; i--) {
      if (dateStrs[i] <= eEnd) {
        endCol = i;
        break;
      }
    }
    if (startCol < 0 || endCol < 0) continue;
    segs.push({
      event: e,
      startCol,
      endCol,
      eventStartDate: eStart,
      eventEndDate: eEnd,
    });
  }

  segs.sort((a, b) => {
    if (a.event.important !== b.event.important) return a.event.important ? -1 : 1;
    if (a.event.startsAt < b.event.startsAt) return -1;
    if (a.event.startsAt > b.event.startsAt) return 1;
    return a.event.id.localeCompare(b.event.id);
  });

  const laneNextFree: number[] = [];
  const cells = new Map<string, MultiDaySegment[]>();

  for (const seg of segs) {
    let lane = -1;
    for (let i = 0; i < laneNextFree.length; i++) {
      if (laneNextFree[i] <= seg.startCol) {
        lane = i;
        laneNextFree[i] = seg.endCol + 1;
        break;
      }
    }
    if (lane === -1) {
      lane = laneNextFree.length;
      laneNextFree.push(seg.endCol + 1);
    }

    for (let col = seg.startCol; col <= seg.endCol; col++) {
      const dateStr = dateStrs[col];
      const list = cells.get(dateStr) ?? [];
      list.push({
        eventId: seg.event.id,
        lane,
        isLeftEdge: col === seg.startCol,
        isRightEdge: col === seg.endCol,
        isEventStart: col === seg.startCol && dateStrs[col] === seg.eventStartDate,
        isEventEnd: col === seg.endCol && dateStrs[col] === seg.eventEndDate,
      });
      cells.set(dateStr, list);
    }
  }

  for (const list of cells.values()) {
    list.sort((a, b) => a.lane - b.lane);
  }

  return { maxLanes: laneNextFree.length, cells };
}

/** Build multi-day band lane assignments for one week row (7 cells, Mon–Sun). */
export function buildMultiDayLanesForRow(
  allEvents: CalendarEvent[],
  row: MonthGridCell[],
): RowLanes {
  return assignLanes(
    allEvents.filter(isMultiDayEvent),
    row.map((c) => c.dateStr),
  );
}

/**
 * Build lane assignments for the week view's all-day strip. Treats both
 * single-day and multi-day all-day events uniformly — every event gets its
 * own lane so vertical position stays consistent across the row.
 */
export function buildAllDayLanesForWeek(
  allEvents: CalendarEvent[],
  weekDates: string[],
): RowLanes {
  return assignLanes(
    allEvents.filter((e) => e.allDay),
    weekDates,
  );
}
