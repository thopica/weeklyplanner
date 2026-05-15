import { format } from 'date-fns';
import {
  PlannerData,
  DayData,
  defaultDayData,
  TimeBlock,
  HabitDefinition,
} from './types';
import {
  type DayScheduleRange,
  clampBlockDuration,
  clampBlockStart,
  clampDayScheduleRange,
  normalizeBlocksToRange,
  OUTLOOK_DEFAULT_DAY_RANGE,
  SLOT_MINUTES,
} from './schedule';

function isLegacyHourBlock(
  b: unknown,
): b is { id: string; hour: number; label: string } {
  return (
    typeof b === 'object' &&
    b !== null &&
    'hour' in b &&
    !('startMinute' in b)
  );
}

function migrateTimeBlocks(
  blocks: unknown[],
  range: DayScheduleRange,
): TimeBlock[] {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];
  if (isLegacyHourBlock(blocks[0])) {
    return (blocks as Array<{ id: string; hour: number; label: string }>).map(
      (old) => ({
        id: old.id,
        startMinute: clampBlockStart(old.hour * 60, range),
        durationMinutes: clampBlockDuration(
          clampBlockStart(old.hour * 60, range),
          60,
          range,
        ),
        label: old.label ?? '',
      }),
    );
  }
  return (blocks as TimeBlock[]).map((b) => {
    const sm = Number(b.startMinute);
    const dm = Number(b.durationMinutes);
    const startBase = Number.isFinite(sm) ? sm : range.startMin;
    const cs = clampBlockStart(startBase, range);
    return {
      id: b.id,
      label: typeof b.label === "string" ? b.label : "",
      startMinute: cs,
      durationMinutes: clampBlockDuration(
        cs,
        Number.isFinite(dm) && dm >= SLOT_MINUTES ? dm : SLOT_MINUTES,
        range,
      ),
    };
  });
}

export const STORAGE_KEYS = {
  PLANNER_DATA: 'weeklyPlanner_data',
  THEME: 'weeklyPlanner_theme',
  SELECTED_DATE: 'weeklyPlanner_selectedDate',
  SCHEDULE_RANGE: 'weeklyPlanner_scheduleRange',
  SCHEDULE_VISIBLE: 'weeklyPlanner_scheduleVisible',
  SCHEDULE_PANE_WIDTH: 'weeklyPlanner_schedulePaneWidth',
};

export const SCHEDULE_PANE_WIDTH_DEFAULT = 312;
export const SCHEDULE_PANE_WIDTH_MIN = 200;
export const SCHEDULE_PANE_WIDTH_MAX = 560;

export function clampSchedulePaneWidth(width: number): number {
  if (!Number.isFinite(width)) return SCHEDULE_PANE_WIDTH_DEFAULT;
  return Math.round(
    Math.min(SCHEDULE_PANE_WIDTH_MAX, Math.max(SCHEDULE_PANE_WIDTH_MIN, width)),
  );
}

export function getSchedulePaneWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE_PANE_WIDTH);
    if (!raw) return SCHEDULE_PANE_WIDTH_DEFAULT;
    return clampSchedulePaneWidth(Number(raw));
  } catch {
    return SCHEDULE_PANE_WIDTH_DEFAULT;
  }
}

export function saveSchedulePaneWidth(width: number): void {
  localStorage.setItem(
    STORAGE_KEYS.SCHEDULE_PANE_WIDTH,
    String(clampSchedulePaneWidth(width)),
  );
}

export function getScheduleVisible(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SCHEDULE_VISIBLE);
    return v !== 'false';
  } catch {
    return true;
  }
}

export function saveScheduleVisible(visible: boolean): void {
  localStorage.setItem(STORAGE_KEYS.SCHEDULE_VISIBLE, String(visible));
}

export function getScheduleRange(): DayScheduleRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE_RANGE);
    if (!raw) return { ...OUTLOOK_DEFAULT_DAY_RANGE };
    const p = JSON.parse(raw) as { startMin?: unknown; endMin?: unknown };
    if (typeof p.startMin === 'number' && typeof p.endMin === 'number') {
      return clampDayScheduleRange({ startMin: p.startMin, endMin: p.endMin });
    }
  } catch {
    /* ignore */
  }
  return { ...OUTLOOK_DEFAULT_DAY_RANGE };
}

/** Persist calendar visible hours and optionally clip all time blocks into the new range. */
export function saveScheduleRange(
  range: DayScheduleRange,
  options: { normalizePlannerData?: boolean } = {},
): void {
  const r = clampDayScheduleRange(range);
  localStorage.setItem(STORAGE_KEYS.SCHEDULE_RANGE, JSON.stringify(r));

  if (options.normalizePlannerData) {
    const data = getPlannerData();
    for (const dateStr of Object.keys(data.days)) {
      const day = data.days[dateStr];
      if (!day || !Array.isArray(day.timeBlocks)) continue;
      const migrated = migrateTimeBlocks(day.timeBlocks, r);
      data.days[dateStr] = {
        ...day,
        timeBlocks: normalizeBlocksToRange(migrated, r),
      };
    }
    savePlannerData(data);
  }
}

function normalizePlannerData(parsed: PlannerData): PlannerData {
  return {
    days: parsed.days ?? {},
    habits: Array.isArray(parsed.habits) ? parsed.habits : [],
  };
}

function normalizeDayData(raw: Partial<DayData> & { waterGlasses?: unknown }): DayData {
  const { waterGlasses: _legacy, ...rest } = raw;
  const merged: DayData = {
    ...structuredClone(defaultDayData),
    ...rest,
    mainFocusCompleted: raw.mainFocusCompleted ?? false,
    habitLogs:
      raw.habitLogs && typeof raw.habitLogs === "object" && !Array.isArray(raw.habitLogs)
        ? { ...raw.habitLogs }
        : {},
  };
  return merged;
}

export function getPlannerData(): PlannerData {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLANNER_DATA);
    return data ? normalizePlannerData(JSON.parse(data)) : { days: {}, habits: [] };
  } catch (e) {
    console.error("Failed to parse planner data", e);
    return { days: {}, habits: [] };
  }
}

export function savePlannerData(data: PlannerData): void {
  localStorage.setItem(STORAGE_KEYS.PLANNER_DATA, JSON.stringify(data));
}

export function getDayData(dateStr: string): DayData {
  const data = getPlannerData();
  const raw = data.days[dateStr];
  if (!raw) return structuredClone(defaultDayData);

  const range = getScheduleRange();

  const needsLegacyMigration =
    Array.isArray(raw.timeBlocks) &&
    raw.timeBlocks.length > 0 &&
    isLegacyHourBlock(raw.timeBlocks[0]);

  const migrated = migrateTimeBlocks(raw.timeBlocks ?? [], range);
  const timeBlocks = normalizeBlocksToRange(migrated, range);

  const merged: DayData = {
    ...normalizeDayData(raw as Partial<DayData> & { waterGlasses?: unknown }),
    timeBlocks,
  };

  if (needsLegacyMigration) {
    data.days[dateStr] = merged;
    savePlannerData(data);
  }

  return merged;
}

export function saveDayData(dateStr: string, dayData: DayData): void {
  const data = getPlannerData();
  data.days[dateStr] = dayData;
  savePlannerData(data);
}

export function getHabits(): HabitDefinition[] {
  return getPlannerData().habits ?? [];
}

export function saveHabits(habits: HabitDefinition[]): void {
  const data = getPlannerData();
  data.habits = habits;
  savePlannerData(data);
}

/** Remove logs for deleted habit ids across all stored days. */
export function pruneHabitLogs(removedIds: string[]): void {
  if (removedIds.length === 0) return;
  const data = getPlannerData();
  let changed = false;
  for (const dateStr of Object.keys(data.days)) {
    const day = data.days[dateStr];
    if (!day?.habitLogs) continue;
    const nextLogs = { ...day.habitLogs };
    let dayChanged = false;
    for (const id of removedIds) {
      if (id in nextLogs) {
        delete nextLogs[id];
        dayChanged = true;
      }
    }
    if (dayChanged) {
      data.days[dateStr] = { ...day, habitLogs: nextLogs };
      changed = true;
    }
  }
  if (changed) savePlannerData(data);
}

export function getTheme(): string {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'theme-boho';
}

export function saveTheme(theme: string): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  document.documentElement.className = theme;
}

/** Returns today's date as YYYY-MM-DD, timezone-safe. */
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getSelectedDate(): string {
  const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_DATE);
  if (stored) return stored;
  const today = todayStr();
  saveSelectedDate(today);
  return today;
}

export function saveSelectedDate(dateStr: string): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_DATE, dateStr);
}

export function loadDemoData(dateStr: string): void {
  const demoHabitRun: HabitDefinition = {
    id: "demo-habit-run",
    name: "Go for a run",
    kind: "boolean",
    createdAt: new Date().toISOString(),
  };
  const demoHabitSteps: HabitDefinition = {
    id: "demo-habit-steps",
    name: "Daily steps",
    kind: "quantifiable",
    unit: "steps",
    target: 1000,
    createdAt: new Date().toISOString(),
  };

  const data = getPlannerData();
  data.habits = [demoHabitRun, demoHabitSteps];
  data.days[dateStr] = {
    mainFocus: "Finish the creative brief for client project",
    mainFocusCompleted: false,
    highPriorityTasks: [
      { id: "hp1", text: "Draft proposal outline", completed: true, createdAt: new Date().toISOString() },
      { id: "hp2", text: "Review feedback with team", completed: false, createdAt: new Date().toISOString() },
      { id: "hp3", text: "Send final invoice", completed: false, createdAt: new Date().toISOString() },
    ],
    generalTasks: [
      { id: "g1", text: "Reply to Sarah's email", completed: true, createdAt: new Date().toISOString() },
      { id: "g2", text: "Order new notebook", completed: true, createdAt: new Date().toISOString() },
      { id: "g3", text: "Water the plants", completed: false, createdAt: new Date().toISOString() },
      { id: "g4", text: "Schedule dentist appointment", completed: false, createdAt: new Date().toISOString() },
      { id: "g5", text: "Clean inbox", completed: false, createdAt: new Date().toISOString() },
    ],
    timeBlocks: [
      { id: "demo-1", startMinute: 8 * 60, durationMinutes: 90, label: "Morning routine & coffee" },
      { id: "demo-2", startMinute: 10 * 60, durationMinutes: 120, label: "Deep work: proposal" },
      { id: "demo-3", startMinute: 13 * 60, durationMinutes: 60, label: "Lunch break" },
      { id: "demo-4", startMinute: 14 * 60 + 30, durationMinutes: 30, label: "Team check-in" },
      { id: "demo-5", startMinute: 15 * 60, durationMinutes: 120, label: "Afternoon focus" },
    ],
    meals: { breakfast: "Oatmeal with berries", lunch: "Salad bowl", dinner: "Pasta" },
    gratitude: ["Sunshine today", "Good coffee", "Finishing a big task"],
    brainDump: "Need to remember to call Mom this weekend. Also, look up recipes for the dinner party on Friday.",
    habitLogs: {
      [demoHabitRun.id]: { completed: true },
      [demoHabitSteps.id]: { actual: 890 },
    },
  };
  savePlannerData(data);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PLANNER_DATA);
  localStorage.removeItem(STORAGE_KEYS.SCHEDULE_RANGE);
}
