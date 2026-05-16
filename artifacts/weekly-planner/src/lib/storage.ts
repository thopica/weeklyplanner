import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import {
  applyAppearance,
  type ColorMode,
  isDarkModeResolved,
} from './appearance';
import {
  PlannerData,
  DayData,
  defaultDayData,
  TimeBlock,
  HabitDefinition,
  Task,
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
  COLOR_MODE: 'weeklyPlanner_colorMode',
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

/** Validate and persist a backup JSON object. Returns false when the shape is invalid. */
export function importPlannerBackup(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Partial<PlannerData>;
  if (!candidate.days || typeof candidate.days !== "object") return false;
  savePlannerData(normalizePlannerData(candidate as PlannerData));
  return true;
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

export function getColorMode(): ColorMode {
  const stored = localStorage.getItem(STORAGE_KEYS.COLOR_MODE);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'light';
}

export function saveTheme(theme: string): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  applyAppearance(theme, getColorMode());
}

export function saveColorMode(mode: ColorMode): void {
  localStorage.setItem(STORAGE_KEYS.COLOR_MODE, mode);
  applyAppearance(getTheme(), mode);
}

export function initAppearance(): void {
  applyAppearance(getTheme(), getColorMode());
}

export function isDarkAppearance(): boolean {
  return isDarkModeResolved(getColorMode());
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

const DEMO_HABIT_RUN_ID = "demo-habit-run";
const DEMO_HABIT_STEPS_ID = "demo-habit-steps";
const DEMO_INSIGHTS_DAYS = 30;

/** Parse YYYY-MM-DD as local noon (avoids UTC day-shift bugs). */
function parseLocalDateStr(dateStr: string): Date {
  return parseISO(`${dateStr}T12:00:00`);
}

function demoIso(dateStr: string, hour = 10): string {
  return parseISO(`${dateStr}T${String(hour).padStart(2, "0")}:30:00`).toISOString();
}

function demoTask(
  id: string,
  dateStr: string,
  text: string,
  completed: boolean,
  hour = 10,
): Task {
  return { id, text, completed, createdAt: demoIso(dateStr, hour) };
}

/** Run habit met? `daysFromEnd` 0 = today; designed for ~12-day streak at end. */
function demoRunMet(daysFromEnd: number): boolean {
  if (daysFromEnd <= 11) return true;
  if (daysFromEnd === 12) return false;
  if (daysFromEnd <= 18) return true;
  if (daysFromEnd === 19) return false;
  return daysFromEnd % 3 !== 0;
}

function demoStepsActual(daysFromEnd: number): number {
  const base = [4200, 9100, 8800, 7600, 10200, 5400, 8300, 7900, 9500, 6200];
  if (daysFromEnd < base.length) return base[daysFromEnd];
  return daysFromEnd % 4 === 0 ? 5200 : 8400 + (daysFromEnd % 5) * 200;
}

function buildDemoInsightsDay(
  dateStr: string,
  daysFromEnd: number,
  runId: string,
  stepsId: string,
  rich: boolean,
): DayData {
  const stepsActual = demoStepsActual(daysFromEnd);
  const runMet = demoRunMet(daysFromEnd);

  if (rich) {
    return {
      mainFocus: "Finish the creative brief for client project",
      mainFocusCompleted: false,
      highPriorityTasks: [
        demoTask("hp1", dateStr, "Draft proposal outline", true, 9),
        demoTask("hp2", dateStr, "Review feedback with team", false, 11),
        demoTask("hp3", dateStr, "Send final invoice", false, 14),
      ],
      generalTasks: [
        demoTask("g1", dateStr, "Reply to Sarah's email", true, 10),
        demoTask("g2", dateStr, "Order new notebook", true, 12),
        demoTask("g3", dateStr, "Water the plants", false, 15),
        demoTask("g4", dateStr, "Schedule dentist appointment", false, 16),
        demoTask("g5", dateStr, "Clean inbox", false, 17),
      ],
      timeBlocks: [
        { id: `demo-${dateStr}-1`, startMinute: 8 * 60, durationMinutes: 90, label: "Morning routine & coffee" },
        { id: `demo-${dateStr}-2`, startMinute: 10 * 60, durationMinutes: 120, label: "Deep work: proposal" },
        { id: `demo-${dateStr}-3`, startMinute: 13 * 60, durationMinutes: 60, label: "Lunch break" },
        { id: `demo-${dateStr}-4`, startMinute: 14 * 60 + 30, durationMinutes: 30, label: "Team check-in" },
        { id: `demo-${dateStr}-5`, startMinute: 15 * 60, durationMinutes: 120, label: "Afternoon focus" },
      ],
      meals: { breakfast: "Oatmeal with berries", lunch: "Salad bowl", dinner: "Pasta" },
      gratitude: ["Sunshine today", "Good coffee", "Finishing a big task"],
      brainDump:
        "Need to remember to call Mom this weekend. Also, look up recipes for the dinner party on Friday.",
      habitLogs: {
        [runId]: { completed: runMet },
        [stepsId]: { actual: stepsActual },
      },
    };
  }

  const cleanSweep = daysFromEnd % 7 === 2 || daysFromEnd === 8;
  const backlogDay = daysFromEnd === 14;

  const highPriorityTasks: Task[] = [
    demoTask(
      `demo-hp-a-${dateStr}`,
      dateStr,
      "Priority task A",
      cleanSweep || daysFromEnd % 2 === 0,
      9,
    ),
    demoTask(
      `demo-hp-b-${dateStr}`,
      dateStr,
      "Priority task B",
      cleanSweep || (daysFromEnd % 3 === 0 && !backlogDay),
      11,
    ),
  ];

  const generalTasks: Task[] = [
    demoTask(
      `demo-g-a-${dateStr}`,
      dateStr,
      "Inbox sweep",
      cleanSweep || daysFromEnd % 4 !== 1,
      13,
    ),
    demoTask(
      `demo-g-b-${dateStr}`,
      dateStr,
      "Errand",
      cleanSweep,
      15,
    ),
    ...(backlogDay
      ? [
          demoTask(`demo-g-c-${dateStr}`, dateStr, "Follow up email", false, 16),
          demoTask(`demo-g-d-${dateStr}`, dateStr, "File expenses", false, 17),
        ]
      : []),
  ];

  const backfill = daysFromEnd === 22;
  if (backfill) {
    generalTasks[0] = {
      ...generalTasks[0],
      createdAt: demoIso(format(addDays(parseLocalDateStr(dateStr), 2), "yyyy-MM-dd"), 18),
    };
  }

  return {
    ...structuredClone(defaultDayData),
    mainFocus:
      daysFromEnd % 5 === 0 ? "Ship weekly review" : "Stay on top of priorities",
    mainFocusCompleted: cleanSweep,
    highPriorityTasks,
    generalTasks,
    habitLogs: {
      [runId]: { completed: runMet },
      [stepsId]: { actual: stepsActual },
    },
  };
}

export function loadDemoData(anchorDateStr: string): void {
  const habitCreatedAt = subDays(parseLocalDateStr(todayStr()), 45).toISOString();
  const demoHabitRun: HabitDefinition = {
    id: DEMO_HABIT_RUN_ID,
    name: "Go for a run",
    kind: "boolean",
    createdAt: habitCreatedAt,
  };
  const demoHabitSteps: HabitDefinition = {
    id: DEMO_HABIT_STEPS_ID,
    name: "Daily steps",
    kind: "quantifiable",
    unit: "steps",
    target: 8000,
    createdAt: habitCreatedAt,
  };

  const end = todayStr();
  const endDate = parseLocalDateStr(end);
  const data: PlannerData = { days: {}, habits: [demoHabitRun, demoHabitSteps] };
  const filledDates = new Set<string>();

  for (let i = DEMO_INSIGHTS_DAYS - 1; i >= 0; i--) {
    const dayDateStr = format(subDays(endDate, i), "yyyy-MM-dd");
    filledDates.add(dayDateStr);
    const daysFromEnd = i;
    const rich = dayDateStr === anchorDateStr || dayDateStr === end;
    data.days[dayDateStr] = buildDemoInsightsDay(
      dayDateStr,
      daysFromEnd,
      DEMO_HABIT_RUN_ID,
      DEMO_HABIT_STEPS_ID,
      rich,
    );
  }

  if (!filledDates.has(anchorDateStr)) {
    const daysFromEnd = Math.max(
      0,
      differenceInCalendarDays(endDate, parseLocalDateStr(anchorDateStr)),
    );
    data.days[anchorDateStr] = buildDemoInsightsDay(
      anchorDateStr,
      daysFromEnd,
      DEMO_HABIT_RUN_ID,
      DEMO_HABIT_STEPS_ID,
      true,
    );
  }

  savePlannerData(data);
  saveSelectedDate(end);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PLANNER_DATA);
  localStorage.removeItem(STORAGE_KEYS.SCHEDULE_RANGE);
}
