import { addMinutes, startOfDay } from "date-fns";
import type { TimeBlock } from "./types";

/** Grid step and minimum block length. */
export const SLOT_MINUTES = 30;

/** Row height for one 30-minute slot (px). */
export const PX_PER_SLOT = 32;

/** Inset so hour labels centered on grid lines are not clipped at range start/end. */
export const TIMELINE_EDGE_INSET_PX = PX_PER_SLOT / 2;

/** Absolute end of calendar day (midnight, exclusive). */
export const CALENDAR_DAY_END_MIN = 24 * 60;

export type DayScheduleRange = {
  /** First visible 30-minute row (minutes from midnight). */
  startMin: number;
  /** End of the visible work day (minutes from midnight, exclusive). Blocks must end at or before this. */
  endMin: number;
};

/** Default workday window: 8:00 AM – 5:00 PM. */
export const OUTLOOK_DEFAULT_DAY_RANGE: DayScheduleRange = {
  startMin: 8 * 60,
  endMin: 17 * 60,
};

export function snapToGrid(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}


export function normalizeScheduleRange(p: {
  startMin: number;
  endMin: number;
}): DayScheduleRange {
  let start = snapToGrid(Math.max(0, Math.min(p.startMin, CALENDAR_DAY_END_MIN - SLOT_MINUTES)));
  let end = snapToGrid(Math.max(0, Math.min(p.endMin, CALENDAR_DAY_END_MIN)));
  if (end <= start + SLOT_MINUTES) {
    end = Math.min(CALENDAR_DAY_END_MIN, start + 4 * SLOT_MINUTES);
  }
  if (end <= start + SLOT_MINUTES) {
    start = Math.max(0, end - 8 * SLOT_MINUTES);
  }
  return { startMin: start, endMin: end };
}

export const clampDayScheduleRange = normalizeScheduleRange;

export function formatScheduleTime(totalMinutes: number): string {
  const base = startOfDay(new Date());
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(addMinutes(base, totalMinutes));
}

export function formatBlockRange(block: TimeBlock): string {
  const end = block.startMinute + block.durationMinutes;
  return `${formatScheduleTime(block.startMinute)} – ${formatScheduleTime(end)}`;
}

/** Half-hour row starts inside [range.startMin, range.endMin). */
export function timelineTicks(range: DayScheduleRange): number[] {
  const ticks: number[] = [];
  for (let m = range.startMin; m < range.endMin; m += SLOT_MINUTES) {
    ticks.push(m);
  }
  return ticks;
}

export function timelineHeightPx(range: DayScheduleRange): number {
  return timelineTicks(range).length * PX_PER_SLOT;
}

export function timelineContentHeightPx(range: DayScheduleRange): number {
  const spanHeight =
    ((range.endMin - range.startMin) / SLOT_MINUTES) * PX_PER_SLOT + TIMELINE_EDGE_INSET_PX * 2;
  const endLabelBottom = minuteToTopPx(range.endMin, range) + TIMELINE_EDGE_INSET_PX;
  const tickHeight = timelineHeightPx(range) + TIMELINE_EDGE_INSET_PX * 2;
  return Math.max(spanHeight, endLabelBottom, tickHeight);
}

export function minuteToTopPx(minute: number, range: DayScheduleRange): number {
  return (
    TIMELINE_EDGE_INSET_PX +
    ((minute - range.startMin) / SLOT_MINUTES) * PX_PER_SLOT
  );
}

export function blockHeightPx(durationMinutes: number): number {
  return (durationMinutes / SLOT_MINUTES) * PX_PER_SLOT;
}

/** Week view: one row per hour. */
export const PX_PER_HOUR = 48;

export const TIMELINE_HOUR_EDGE_INSET_PX = PX_PER_HOUR / 2;

export type ScheduleTimelineGranularity = "halfHour" | "hour";

/** Hour row starts (on the hour) within [range.startMin, range.endMin). */
export function timelineHourTicks(range: DayScheduleRange): number[] {
  const ticks: number[] = [];
  let hour = Math.floor(range.startMin / 60) * 60;
  if (hour < range.startMin) hour += 60;
  for (; hour < range.endMin; hour += 60) {
    ticks.push(hour);
  }
  return ticks;
}

/** Time-rail labels — grid ticks plus configured end time at the bottom. */
export function timelineRailLabels(
  range: DayScheduleRange,
  granularity: ScheduleTimelineGranularity = "halfHour",
): number[] {
  const ticks = granularity === "hour" ? timelineHourTicks(range) : timelineTicks(range);
  const last = ticks[ticks.length - 1];
  if (last === range.endMin) return ticks;
  return [...ticks, range.endMin];
}

export function timelineHourContentHeightPx(range: DayScheduleRange): number {
  const spanHeight =
    ((range.endMin - range.startMin) / 60) * PX_PER_HOUR + TIMELINE_HOUR_EDGE_INSET_PX * 2;
  const endLabelBottom = minuteToTopPxHourly(range.endMin, range) + TIMELINE_HOUR_EDGE_INSET_PX;
  return Math.max(spanHeight, endLabelBottom);
}

export function minuteToTopPxHourly(minute: number, range: DayScheduleRange): number {
  return (
    TIMELINE_HOUR_EDGE_INSET_PX +
    ((minute - range.startMin) / 60) * PX_PER_HOUR
  );
}

export function blockHeightPxHourly(durationMinutes: number): number {
  return (durationMinutes / 60) * PX_PER_HOUR;
}

/** Latest valid block start on the grid for the given range (30-min aligned). */
export function lastSlotStartInRange(range: DayScheduleRange): number {
  return range.endMin - SLOT_MINUTES;
}

export function maxDurationForStart(
  startMinute: number,
  range: DayScheduleRange,
): number {
  const raw = range.endMin - startMinute;
  return Math.max(SLOT_MINUTES, Math.floor(raw / SLOT_MINUTES) * SLOT_MINUTES);
}

export function clampBlockDuration(
  startMinute: number,
  durationMinutes: number,
  range: DayScheduleRange,
): number {
  const snapped = snapToGrid(durationMinutes);
  const max = maxDurationForStart(startMinute, range);
  return Math.min(Math.max(snapped, SLOT_MINUTES), max);
}

export function clampBlockStart(
  startMinute: number,
  range: DayScheduleRange,
): number {
  const snapped = snapToGrid(startMinute);
  const hi = lastSlotStartInRange(range);
  return Math.min(Math.max(snapped, range.startMin), hi);
}

export function clampStartWithDuration(
  startMinute: number,
  durationMinutes: number,
  range: DayScheduleRange,
): number {
  const snapped = snapToGrid(startMinute);
  const dur = Math.max(SLOT_MINUTES, snapToGrid(durationMinutes));
  const maxStart = range.endMin - dur;
  return Math.min(Math.max(snapped, range.startMin), maxStart);
}

/** [start, start+duration) overlaps any other block (excluding ignoreId). */
export function hasTimeConflict(
  start: number,
  duration: number,
  blocks: TimeBlock[],
  ignoreId?: string,
): boolean {
  const end = start + duration;
  for (const b of blocks) {
    if (ignoreId !== undefined && b.id === ignoreId) continue;
    const be = b.startMinute + b.durationMinutes;
    if (start < be && b.startMinute < end) return true;
  }
  return false;
}

export function nextBlockStartAfter(
  afterStart: number,
  blocks: TimeBlock[],
  ignoreId: string,
): number | null {
  let best: number | null = null;
  for (const b of blocks) {
    if (b.id === ignoreId) continue;
    if (b.startMinute > afterStart && (best === null || b.startMinute < best)) {
      best = b.startMinute;
    }
  }
  return best;
}

export function maxExclusiveEndForStart(
  start: number,
  blocks: TimeBlock[],
  ignoreId: string,
  range: DayScheduleRange,
): number {
  const n = nextBlockStartAfter(start, blocks, ignoreId);
  const cap = n === null ? range.endMin : n;
  return Math.min(cap, range.endMin);
}

export function validDurationsFromStart(
  start: number,
  blocks: TimeBlock[],
  range: DayScheduleRange,
  ignoreId?: string,
): number[] {
  const out: number[] = [];
  const max = maxDurationForStart(start, range);
  for (let d = SLOT_MINUTES; d <= max; d += SLOT_MINUTES) {
    if (!hasTimeConflict(start, d, blocks, ignoreId)) out.push(d);
  }
  return out;
}

export function validExclusiveEndsFromStart(
  start: number,
  blocks: TimeBlock[],
  range: DayScheduleRange,
  ignoreId?: string,
): number[] {
  const out: number[] = [];
  for (
    let end = start + SLOT_MINUTES;
    end <= range.endMin;
    end += SLOT_MINUTES
  ) {
    const dur = end - start;
    if (!hasTimeConflict(start, dur, blocks, ignoreId)) out.push(end);
  }
  return out;
}

export function nextDefaultStartMinute(
  blocks: TimeBlock[],
  range: DayScheduleRange,
): number {
  if (blocks.length === 0) return range.startMin;
  const latestEnd = Math.max(
    ...blocks.map((b) => b.startMinute + b.durationMinutes),
    range.startMin,
  );
  const snapped =
    Math.ceil(latestEnd / SLOT_MINUTES) * SLOT_MINUTES;
  if (snapped >= range.endMin) return range.startMin;
  return Math.min(snapped, lastSlotStartInRange(range));
}

/** Clip time blocks into [range.startMin, range.endMin); drops if shorter than one slot. */
export function normalizeBlocksToRange(
  blocks: TimeBlock[],
  range: DayScheduleRange,
): TimeBlock[] {
  const out: TimeBlock[] = [];
  for (const b of blocks) {
    let s = snapToGrid(b.startMinute);
    let e = b.startMinute + b.durationMinutes;
    s = Math.max(s, range.startMin);
    e = Math.min(e, range.endMin);
    if (e <= s) continue;
    let dur = snapToGrid(e - s);
    if (dur < SLOT_MINUTES) continue;
    s = clampBlockStart(s, range);
    dur = clampBlockDuration(s, dur, range);
    if (dur < SLOT_MINUTES) continue;
    out.push({ ...b, startMinute: s, durationMinutes: dur });
  }
  return out;
}

/** Every 30-minute mark from midnight through 11:30 PM (for settings pickers). */
export function allDayGridMinutes(): number[] {
  const a: number[] = [];
  for (let m = 0; m <= 23 * 60 + 30; m += SLOT_MINUTES) {
    a.push(m);
  }
  return a;
}

/** Valid exclusive day ends on the half-hour through midnight (30 … 1440). */
export function allExclusiveEndMinutes(): number[] {
  const out: number[] = [];
  for (let e = SLOT_MINUTES; e <= CALENDAR_DAY_END_MIN; e += SLOT_MINUTES) {
    out.push(e);
  }
  return out;
}
