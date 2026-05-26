import { addDays, format } from "date-fns";
import {
  CalendarEvent,
  FALLBACK_CATEGORY_ID,
  MAX_EVENT_TITLE_LENGTH,
  PlannerData,
} from "./types";
import { parseLocalDateStr } from "./dates";

const STORAGE_KEY = "weeklyPlanner_events";
const MIGRATION_FLAG_KEY = "weeklyPlanner_eventsMigrated";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const FLOATING_DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Build a floating local-time ISO-like string from a date string + minute offset. */
export function buildFloatingDateTime(
  dateStr: string,
  minutesFromMidnight: number,
): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${dateStr}T${pad2(h)}:${pad2(m)}:00`;
}

/** Start-of-day boundary for an all-day event. */
function dayStart(dateStr: string): string {
  return `${dateStr}T00:00:00`;
}

/** Exclusive end-of-day boundary (= next day at 00:00). */
export function dayEndExclusive(dateStr: string): string {
  const next = addDays(parseLocalDateStr(dateStr), 1);
  return `${format(next, "yyyy-MM-dd")}T00:00:00`;
}

function isValidFloatingDateTime(value: unknown): value is string {
  return typeof value === "string" && FLOATING_DT_RE.test(value);
}

function normalizeEvent(raw: unknown): CalendarEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const e = raw as Partial<CalendarEvent>;
  if (typeof e.id !== "string" || !e.id.trim()) return null;
  if (!isValidFloatingDateTime(e.startsAt)) return null;
  if (!isValidFloatingDateTime(e.endsAt)) return null;
  if (e.endsAt <= e.startsAt) return null;
  return {
    id: e.id,
    title:
      typeof e.title === "string"
        ? e.title.slice(0, MAX_EVENT_TITLE_LENGTH)
        : "",
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    allDay: Boolean(e.allDay),
    categoryId:
      typeof e.categoryId === "string" && e.categoryId.trim()
        ? e.categoryId
        : FALLBACK_CATEGORY_ID,
    important: Boolean(e.important),
  };
}

export function normalizeEventList(raw: unknown): CalendarEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeEvent)
    .filter((e): e is CalendarEvent => e !== null);
}

export function saveEvents(events: CalendarEvent[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return true;
  } catch (e) {
    console.error("Failed to save events", e);
    return false;
  }
}

export function getEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeEventList(JSON.parse(raw));
  } catch (e) {
    console.error("Failed to parse events", e);
    return [];
  }
}

function generateEventId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `evt-${crypto.randomUUID()}`
    : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addEvent(input: Omit<CalendarEvent, "id"> & { id?: string }): CalendarEvent {
  const list = getEvents();
  const next: CalendarEvent = {
    id: input.id ?? generateEventId(),
    title: input.title.slice(0, MAX_EVENT_TITLE_LENGTH),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    allDay: input.allDay,
    categoryId: input.categoryId || FALLBACK_CATEGORY_ID,
    important: input.important,
  };
  saveEvents([...list, next]);
  return next;
}

export function updateEvent(
  id: string,
  patch: Partial<Omit<CalendarEvent, "id">>,
): CalendarEvent | null {
  const list = getEvents();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const current = list[idx];
  const next: CalendarEvent = {
    ...current,
    ...patch,
    id: current.id,
    title:
      typeof patch.title === "string"
        ? patch.title.slice(0, MAX_EVENT_TITLE_LENGTH)
        : current.title,
    categoryId: patch.categoryId || current.categoryId,
  };
  if (next.endsAt <= next.startsAt) return null;
  const updated = [...list];
  updated[idx] = next;
  saveEvents(updated);
  return next;
}

export function deleteEvent(id: string): boolean {
  const list = getEvents();
  const next = list.filter((e) => e.id !== id);
  if (next.length === list.length) return false;
  saveEvents(next);
  return true;
}

/** Reassign all events from `fromCategoryId` to `toCategoryId`. */
export function reassignEventsCategory(
  fromCategoryId: string,
  toCategoryId: string,
): number {
  const list = getEvents();
  let count = 0;
  const next = list.map((e) => {
    if (e.categoryId !== fromCategoryId) return e;
    count += 1;
    return { ...e, categoryId: toCategoryId };
  });
  if (count > 0) saveEvents(next);
  return count;
}

/**
 * Return events that touch the given day (inclusive overlap with [00:00, 24:00)).
 * String-comparison works because all floating local-time strings have the same
 * fixed format and precision.
 */
export function getEventsForDay(dateStr: string): CalendarEvent[] {
  if (!DATE_KEY_RE.test(dateStr)) return [];
  const start = dayStart(dateStr);
  const end = dayEndExclusive(dateStr);
  return getEvents().filter((e) => e.startsAt < end && e.endsAt > start);
}

/** True if an event spans more than the calendar day it starts on. */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const startDate = event.startsAt.slice(0, 10);
  const endDate = event.endsAt.slice(0, 10);
  if (startDate === endDate) return false;
  if (event.allDay) {
    const next = addDays(parseLocalDateStr(startDate), 1);
    return endDate !== format(next, "yyyy-MM-dd");
  }
  return true;
}

/**
 * One-time migration from per-day `DayData.timeBlocks` to the global Events store.
 * Idempotent: guarded by `weeklyPlanner_eventsMigrated` flag in localStorage.
 *
 * Each TimeBlock becomes a CalendarEvent in the FALLBACK category, not important.
 * Original timeBlocks are left in place on disk for safe rollback (Phase 2 will
 * stop reading them).
 */
export function migrateTimeBlocksToEventsIfNeeded(planner: PlannerData): void {
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === "true") return;
  } catch {
    return;
  }

  const existing = getEvents();
  const existingIds = new Set(existing.map((e) => e.id));
  const migrated: CalendarEvent[] = [];

  for (const [dateStr, day] of Object.entries(planner.days)) {
    if (!DATE_KEY_RE.test(dateStr)) continue;
    const blocks = day?.timeBlocks;
    if (!Array.isArray(blocks)) continue;
    for (const block of blocks) {
      if (!block || typeof block.id !== "string") continue;
      if (existingIds.has(block.id)) continue;
      const startMinute = Math.max(0, Math.floor(Number(block.startMinute)));
      const durationMinutes = Math.max(0, Math.floor(Number(block.durationMinutes)));
      if (!Number.isFinite(startMinute) || !Number.isFinite(durationMinutes)) continue;
      if (durationMinutes <= 0) continue;
      const startsAt = buildFloatingDateTime(dateStr, startMinute);
      const endMinute = Math.min(24 * 60, startMinute + durationMinutes);
      const endsAt =
        endMinute >= 24 * 60
          ? dayEndExclusive(dateStr)
          : buildFloatingDateTime(dateStr, endMinute);
      migrated.push({
        id: block.id,
        title: typeof block.label === "string" ? block.label : "",
        startsAt,
        endsAt,
        allDay: false,
        categoryId: FALLBACK_CATEGORY_ID,
        important: false,
      });
    }
  }

  if (migrated.length > 0) {
    saveEvents([...existing, ...migrated]);
  }

  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, "true");
  } catch (e) {
    console.error("Failed to set events migration flag", e);
  }
}
