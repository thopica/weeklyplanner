import {
  CalendarEvent,
  FALLBACK_CATEGORY_ID,
  TimeBlock,
} from "./types";
import {
  addEvent,
  buildFloatingDateTime,
  dayEndExclusive,
  deleteEvent,
  getEventsForDay,
  updateEvent,
} from "./events";

/**
 * Extract HH*60+mm from a floating local-time string "YYYY-MM-DDTHH:mm:ss".
 * Character slicing — no Date parsing — so the result is DST-safe.
 */
function minutesFromMidnight(floatingDt: string): number {
  const h = Number(floatingDt.slice(11, 13));
  const m = Number(floatingDt.slice(14, 16));
  return h * 60 + m;
}

/**
 * Project events that touch `dateStr` onto the day's minute-offset window.
 * Multi-day events clip at midnight (start = 0 or end = 1440). All-day events
 * are dropped (Phase 6's banner row owns those). Result sorted by `startMinute`.
 */
export function projectEventsToDayBlocks(dateStr: string): TimeBlock[] {
  const events = getEventsForDay(dateStr).filter((e) => !e.allDay);
  const blocks: TimeBlock[] = [];
  for (const event of events) {
    const startDateStr = event.startsAt.slice(0, 10);
    const endDateStr = event.endsAt.slice(0, 10);
    const startMin =
      startDateStr < dateStr ? 0 : minutesFromMidnight(event.startsAt);
    const endMin =
      endDateStr > dateStr ? 24 * 60 : minutesFromMidnight(event.endsAt);
    const durationMinutes = endMin - startMin;
    if (durationMinutes <= 0) continue;
    blocks.push({
      id: event.id,
      startMinute: startMin,
      durationMinutes,
      label: event.title,
    });
  }
  blocks.sort((a, b) => a.startMinute - b.startMinute);
  return blocks;
}

/** All-day events that touch `dateStr`, sorted by `startsAt`. */
export function getAllDayEventsForDay(dateStr: string): CalendarEvent[] {
  return getEventsForDay(dateStr)
    .filter((e) => e.allDay)
    .sort((a, b) =>
      a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0,
    );
}

/**
 * Diff `nextBlocks` against the current Day projection and emit the minimal
 * set of addEvent / updateEvent / deleteEvent calls so the events store
 * mirrors what the user just edited in the Day view.
 *
 * Multi-day caveat: any block that came from a clipped projection (because
 * the event spans midnight) gets re-authored as a single-day event for
 * `dateStr` on edit. Acceptable until Phase 4's EventDialog gains multi-day
 * editing — no migrated event triggers this case (all migrated events are
 * single-day).
 */
export function syncBlocksToEventsForDay(
  dateStr: string,
  nextBlocks: TimeBlock[],
): void {
  const current = projectEventsToDayBlocks(dateStr);
  const currentById = new Map(current.map((b) => [b.id, b]));
  const nextIds = new Set(nextBlocks.map((b) => b.id));

  for (const block of current) {
    if (!nextIds.has(block.id)) {
      deleteEvent(block.id);
    }
  }

  for (const block of nextBlocks) {
    const startsAt = buildFloatingDateTime(dateStr, block.startMinute);
    const endMin = block.startMinute + block.durationMinutes;
    const endsAt =
      endMin >= 24 * 60
        ? dayEndExclusive(dateStr)
        : buildFloatingDateTime(dateStr, endMin);
    const existing = currentById.get(block.id);
    if (!existing) {
      addEvent({
        id: block.id,
        title: block.label,
        startsAt,
        endsAt,
        allDay: false,
        categoryId: FALLBACK_CATEGORY_ID,
        important: false,
      });
      continue;
    }
    if (
      existing.startMinute !== block.startMinute ||
      existing.durationMinutes !== block.durationMinutes ||
      existing.label !== block.label
    ) {
      updateEvent(block.id, {
        title: block.label,
        startsAt,
        endsAt,
      });
    }
  }
}
