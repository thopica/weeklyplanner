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
  MAX_HABITS,
  CalendarEvent,
  CategoryDefinition,
} from './types';
import {
  getEvents,
  saveEvents,
  normalizeEventList,
  migrateTimeBlocksToEventsIfNeeded,
} from './events';
import {
  getCategories,
  reconcileDeletedDefaultsFromList,
  saveCategories,
} from './categories';
import {
  type DayScheduleRange,
  clampBlockDuration,
  clampBlockStart,
  clampDayScheduleRange,
  normalizeBlocksToRange,
  OUTLOOK_DEFAULT_DAY_RANGE,
  SNAP_MINUTES,
} from './schedule';
import {
  DEFAULT_POMODORO_SETTINGS,
  normalizePomodoroSettings,
  type PomodoroSettings,
} from './pomodoro';
export type StorageWriteResult =
  | { ok: true }
  | { ok: false; code: "quota" | "unavailable" | "unknown"; message: string };

export type ImportBackupResult =
  | StorageWriteResult
  | { ok: false; code: "invalid"; message: string };

/** Full backup format (v1): planner content plus UI and Pomodoro preferences. */
export const PLANNER_BACKUP_VERSION = 1 as const;

export interface PlannerBackupPreferences {
  theme: string;
  colorMode: ColorMode;
  selectedDate: string;
  scheduleRange: DayScheduleRange;
  scheduleVisible: boolean;
  schedulePaneWidth: number;
  pomodoro: PomodoroSettings;
}

export interface PlannerBackupV1 {
  version: typeof PLANNER_BACKUP_VERSION;
  exportedAt: string;
  planner: PlannerData;
  preferences: PlannerBackupPreferences;
  /** Additive in this release; absent in legacy v1 exports. */
  events?: CalendarEvent[];
  /** Additive in this release; absent in legacy v1 exports. */
  categories?: CategoryDefinition[];
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function writeLocalStorage(key: string, value: string): StorageWriteResult {
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22)
    ) {
      return {
        ok: false,
        code: "quota",
        message:
          "Storage is full. Export a backup, then remove old content before saving again.",
      };
    }
    if (e instanceof DOMException && e.name === "SecurityError") {
      return {
        ok: false,
        code: "unavailable",
        message: "Browser storage is not available in this context.",
      };
    }
    console.error("localStorage.setItem failed", key, e);
    return {
      ok: false,
      code: "unknown",
      message: "Could not save your data. Try again or export a backup first.",
    };
  }
}

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

  const migrated = blocks
    .map((block): TimeBlock | null => {
      if (isLegacyHourBlock(block)) {
        const startMinute = clampBlockStart(block.hour * 60, range);
        return {
          id: typeof block.id === "string" ? block.id : crypto.randomUUID(),
          startMinute,
          durationMinutes: clampBlockDuration(startMinute, 60, range),
          label: typeof block.label === "string" ? block.label : "",
        };
      }
      if (typeof block !== "object" || block === null) return null;
      const b = block as Partial<TimeBlock>;
      if (typeof b.id !== "string" || !b.id) return null;
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
          Number.isFinite(dm) && dm >= SNAP_MINUTES ? dm : SNAP_MINUTES,
          range,
        ),
      };
    })
    .filter((b): b is TimeBlock => b !== null);

  return normalizeBlocksToRange(migrated, range);
}

function normalizeTask(raw: unknown): Task | null {
  if (typeof raw !== "object" || raw === null) return null;
  const t = raw as Partial<Task>;
  if (typeof t.id !== "string" || !t.id.trim()) return null;
  return {
    id: t.id,
    text: typeof t.text === "string" ? t.text : "",
    completed: Boolean(t.completed),
    createdAt:
      typeof t.createdAt === "string" && t.createdAt
        ? t.createdAt
        : new Date().toISOString(),
  };
}

function normalizeTaskList(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeTask).filter((t): t is Task => t !== null);
}

function normalizeHabit(raw: unknown): HabitDefinition | null {
  if (typeof raw !== "object" || raw === null) return null;
  const h = raw as Partial<HabitDefinition>;
  if (typeof h.id !== "string" || !h.id.trim()) return null;
  if (typeof h.name !== "string") return null;
  const kind = h.kind === "quantifiable" ? "quantifiable" : "boolean";
  const habit: HabitDefinition = {
    id: h.id,
    name: h.name,
    kind,
    createdAt:
      typeof h.createdAt === "string" && h.createdAt
        ? h.createdAt
        : new Date().toISOString(),
  };
  if (kind === "quantifiable") {
    if (typeof h.unit === "string") habit.unit = h.unit;
    if (typeof h.target === "number" && Number.isFinite(h.target)) {
      habit.target = h.target;
    }
  }
  return habit;
}

function normalizeHabitsList(raw: unknown): HabitDefinition[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeHabit)
    .filter((h): h is HabitDefinition => h !== null)
    .slice(0, MAX_HABITS);
}

export const STORAGE_KEYS = {
  PLANNER_DATA: 'weeklyPlanner_data',
  THEME: 'weeklyPlanner_theme',
  COLOR_MODE: 'weeklyPlanner_colorMode',
  SELECTED_DATE: 'weeklyPlanner_selectedDate',
  SCHEDULE_RANGE: 'weeklyPlanner_scheduleRange',
  SCHEDULE_VISIBLE: 'weeklyPlanner_scheduleVisible',
  SCHEDULE_PANE_WIDTH: 'weeklyPlanner_schedulePaneWidth',
  POMODORO: 'weeklyPlanner_pomodoro',
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

export function saveSchedulePaneWidth(width: number): StorageWriteResult {
  return writeLocalStorage(
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

export function saveScheduleVisible(visible: boolean): StorageWriteResult {
  return writeLocalStorage(STORAGE_KEYS.SCHEDULE_VISIBLE, String(visible));
}

export function getScheduleRange(): DayScheduleRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE_RANGE);
    if (!raw) return { ...OUTLOOK_DEFAULT_DAY_RANGE };
    const p = JSON.parse(raw) as { startMin?: unknown; endMin?: unknown };
    if (
      typeof p.startMin === "number" &&
      typeof p.endMin === "number" &&
      Number.isFinite(p.startMin) &&
      Number.isFinite(p.endMin)
    ) {
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
): StorageWriteResult {
  const r = clampDayScheduleRange(range);
  const rangeResult = writeLocalStorage(
    STORAGE_KEYS.SCHEDULE_RANGE,
    JSON.stringify(r),
  );
  if (!rangeResult.ok) return rangeResult;

  if (options.normalizePlannerData) {
    const data = getPlannerData();
    for (const dateStr of Object.keys(data.days)) {
      const day = data.days[dateStr];
      if (!day) continue;
      const migrated = migrateTimeBlocks(day.timeBlocks ?? [], r);
      data.days[dateStr] = {
        ...day,
        timeBlocks: migrated,
      };
    }
    return savePlannerData(data);
  }

  return { ok: true };
}

function normalizePlannerData(parsed: Partial<PlannerData>): PlannerData {
  const days: Record<string, DayData> = {};
  if (parsed.days && typeof parsed.days === "object" && !Array.isArray(parsed.days)) {
    for (const [dateStr, raw] of Object.entries(parsed.days)) {
      if (!DATE_KEY_RE.test(dateStr)) continue;
      days[dateStr] = normalizeDayData(raw);
    }
  }
  return {
    days,
    habits: normalizeHabitsList(parsed.habits),
  };
}

function normalizeDayData(raw: unknown): DayData {
  if (typeof raw !== "object" || raw === null) {
    return structuredClone(defaultDayData);
  }
  const r = raw as Partial<DayData> & { waterGlasses?: unknown };
  const mealsRaw =
    r.meals && typeof r.meals === "object" && !Array.isArray(r.meals)
      ? (r.meals as Partial<DayData["meals"]>)
      : null;

  return {
    mainFocus: typeof r.mainFocus === "string" ? r.mainFocus : "",
    mainFocusCompleted: Boolean(r.mainFocusCompleted),
    highPriorityTasks: normalizeTaskList(r.highPriorityTasks),
    generalTasks: normalizeTaskList(r.generalTasks),
    timeBlocks: Array.isArray(r.timeBlocks) ? (r.timeBlocks as TimeBlock[]) : [],
    meals: {
      breakfast: typeof mealsRaw?.breakfast === "string" ? mealsRaw.breakfast : "",
      lunch: typeof mealsRaw?.lunch === "string" ? mealsRaw.lunch : "",
      dinner: typeof mealsRaw?.dinner === "string" ? mealsRaw.dinner : "",
    },
    gratitude: Array.isArray(r.gratitude)
      ? r.gratitude.slice(0, 3).map((g) => (typeof g === "string" ? g : ""))
      : ["", "", ""],
    brainDump: typeof r.brainDump === "string" ? r.brainDump : "",
    habitLogs:
      r.habitLogs && typeof r.habitLogs === "object" && !Array.isArray(r.habitLogs)
        ? { ...r.habitLogs }
        : {},
  };
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

export function savePlannerData(data: PlannerData): StorageWriteResult {
  return writeLocalStorage(STORAGE_KEYS.PLANNER_DATA, JSON.stringify(data));
}

function isPlannerBackupV1(raw: unknown): raw is PlannerBackupV1 {
  if (typeof raw !== "object" || raw === null) return false;
  const b = raw as Partial<PlannerBackupV1>;
  return (
    b.version === PLANNER_BACKUP_VERSION &&
    b.planner !== undefined &&
    typeof b.planner === "object" &&
    b.planner !== null
  );
}

function normalizeBackupPreferences(
  raw: Partial<PlannerBackupPreferences> | undefined,
): PlannerBackupPreferences {
  const scheduleRange =
    raw?.scheduleRange &&
    typeof raw.scheduleRange.startMin === "number" &&
    typeof raw.scheduleRange.endMin === "number"
      ? clampDayScheduleRange(raw.scheduleRange)
      : getScheduleRange();

  return {
    theme: typeof raw?.theme === "string" && raw.theme ? raw.theme : getTheme(),
    colorMode:
      raw?.colorMode === "light" ||
      raw?.colorMode === "dark" ||
      raw?.colorMode === "system"
        ? raw.colorMode
        : getColorMode(),
    selectedDate:
      typeof raw?.selectedDate === "string" && DATE_KEY_RE.test(raw.selectedDate)
        ? raw.selectedDate
        : getSelectedDate(),
    scheduleRange,
    scheduleVisible:
      typeof raw?.scheduleVisible === "boolean" ? raw.scheduleVisible : getScheduleVisible(),
    schedulePaneWidth:
      typeof raw?.schedulePaneWidth === "number"
        ? clampSchedulePaneWidth(raw.schedulePaneWidth)
        : getSchedulePaneWidth(),
    pomodoro: normalizePomodoroSettings(raw?.pomodoro),
  };
}

function migratePlannerTimeBlocks(
  planner: PlannerData,
  range: DayScheduleRange,
): PlannerData {
  const days: Record<string, DayData> = {};
  for (const [dateStr, day] of Object.entries(planner.days)) {
    days[dateStr] = {
      ...day,
      timeBlocks: migrateTimeBlocks(day.timeBlocks ?? [], range),
    };
  }
  return { ...planner, days };
}

/** Collect all planner content and local preferences for export. */
export function buildPlannerBackup(): PlannerBackupV1 {
  return {
    version: PLANNER_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    planner: getPlannerData(),
    preferences: {
      theme: getTheme(),
      colorMode: getColorMode(),
      selectedDate: getSelectedDate(),
      scheduleRange: getScheduleRange(),
      scheduleVisible: getScheduleVisible(),
      schedulePaneWidth: getSchedulePaneWidth(),
      pomodoro: getPomodoroSettings(),
    },
    events: getEvents(),
    categories: getCategories(),
  };
}

function applyBackupPreferences(prefs: PlannerBackupPreferences): StorageWriteResult {
  const rangeResult = writeLocalStorage(
    STORAGE_KEYS.SCHEDULE_RANGE,
    JSON.stringify(prefs.scheduleRange),
  );
  if (!rangeResult.ok) return rangeResult;

  const results: StorageWriteResult[] = [
    saveScheduleVisible(prefs.scheduleVisible),
    saveSchedulePaneWidth(prefs.schedulePaneWidth),
    savePomodoroSettings(prefs.pomodoro),
    saveTheme(prefs.theme),
    saveColorMode(prefs.colorMode),
    saveSelectedDate(prefs.selectedDate),
  ];

  const failed = results.find((r) => !r.ok);
  return failed ?? { ok: true };
}

/** Validate and persist a backup JSON object (v1 full backup or legacy planner-only). */
export function importPlannerBackup(raw: unknown): ImportBackupResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, code: "invalid", message: "Invalid backup file format." };
  }

  if (isPlannerBackupV1(raw)) {
    const candidate = raw.planner as Partial<PlannerData>;
    if (
      !candidate.days ||
      typeof candidate.days !== "object" ||
      Array.isArray(candidate.days)
    ) {
      return { ok: false, code: "invalid", message: "Invalid backup file format." };
    }

    const prefs = normalizeBackupPreferences(raw.preferences);
    const planner = migratePlannerTimeBlocks(
      normalizePlannerData(candidate),
      prefs.scheduleRange,
    );

    const plannerResult = savePlannerData(planner);
    if (!plannerResult.ok) return plannerResult;

    if (Array.isArray(raw.events)) {
      saveEvents(normalizeEventList(raw.events));
    }
    if (Array.isArray(raw.categories)) {
      saveCategories(raw.categories);
      reconcileDeletedDefaultsFromList(raw.categories);
    }

    return applyBackupPreferences(prefs);
  }

  const candidate = raw as Partial<PlannerData>;
  if (
    !candidate.days ||
    typeof candidate.days !== "object" ||
    Array.isArray(candidate.days)
  ) {
    return { ok: false, code: "invalid", message: "Invalid backup file format." };
  }

  const range = getScheduleRange();
  const planner = migratePlannerTimeBlocks(normalizePlannerData(candidate), range);
  return savePlannerData(planner);
}

export function getDayData(dateStr: string): DayData {
  const data = getPlannerData();
  const raw = data.days[dateStr];
  if (!raw) return structuredClone(defaultDayData);

  const range = getScheduleRange();

  const blocks = raw.timeBlocks ?? [];
  const needsLegacyMigration =
    Array.isArray(blocks) && blocks.some((b) => isLegacyHourBlock(b));

  const timeBlocks = migrateTimeBlocks(blocks, range);

  const merged: DayData = {
    ...normalizeDayData(raw),
    timeBlocks,
  };

  if (needsLegacyMigration) {
    data.days[dateStr] = merged;
    const saveResult = savePlannerData(data);
    if (!saveResult.ok) {
      console.error("Failed to persist legacy time-block migration", saveResult);
    }
  }

  return merged;
}

export function saveDayData(dateStr: string, dayData: DayData): StorageWriteResult {
  const data = getPlannerData();
  data.days[dateStr] = dayData;
  return savePlannerData(data);
}

export function getHabits(): HabitDefinition[] {
  return getPlannerData().habits ?? [];
}

export function saveHabits(habits: HabitDefinition[]): StorageWriteResult {
  const data = getPlannerData();
  data.habits = habits;
  return savePlannerData(data);
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
  if (changed) {
    const result = savePlannerData(data);
    if (!result.ok) {
      console.error("Failed to prune habit logs", result);
    }
  }
}

export function getPomodoroSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POMODORO);
    if (!raw) return { ...DEFAULT_POMODORO_SETTINGS };
    return normalizePomodoroSettings(JSON.parse(raw) as Partial<PomodoroSettings>);
  } catch {
    return { ...DEFAULT_POMODORO_SETTINGS };
  }
}

export function savePomodoroSettings(settings: PomodoroSettings): StorageWriteResult {
  const normalized = normalizePomodoroSettings(settings);
  return writeLocalStorage(STORAGE_KEYS.POMODORO, JSON.stringify(normalized));
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

export function saveTheme(theme: string): StorageWriteResult {
  const result = writeLocalStorage(STORAGE_KEYS.THEME, theme);
  if (result.ok) applyAppearance(theme, getColorMode());
  return result;
}

export function saveColorMode(mode: ColorMode): StorageWriteResult {
  const result = writeLocalStorage(STORAGE_KEYS.COLOR_MODE, mode);
  if (result.ok) applyAppearance(getTheme(), mode);
  return result;
}

export function initAppearance(): void {
  applyAppearance(getTheme(), getColorMode());
}

/**
 * Seed default categories (if none yet) and run the one-time TimeBlock → Event
 * migration. Safe to call on every boot — both steps are idempotent.
 */
export function initEventsAndCategories(): void {
  try {
    getCategories();
    migrateTimeBlocksToEventsIfNeeded(getPlannerData());
  } catch (e) {
    console.error("Failed to initialize events/categories", e);
  }
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

export function saveSelectedDate(dateStr: string): StorageWriteResult {
  return writeLocalStorage(STORAGE_KEYS.SELECTED_DATE, dateStr);
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

export function loadDemoData(anchorDateStr: string): StorageWriteResult {
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

  const plannerResult = savePlannerData(data);
  if (!plannerResult.ok) return plannerResult;

  localStorage.removeItem("weeklyPlanner_events");
  localStorage.removeItem("weeklyPlanner_eventsMigrated");
  migrateTimeBlocksToEventsIfNeeded(data);

  return saveSelectedDate(end);
}

/** Removes planner days/habits and calendar hour range; keeps theme, Pomodoro, and UI prefs. */
export function clearPlannerData(): void {
  localStorage.removeItem(STORAGE_KEYS.PLANNER_DATA);
  localStorage.removeItem(STORAGE_KEYS.SCHEDULE_RANGE);
  localStorage.removeItem("weeklyPlanner_events");
  localStorage.removeItem("weeklyPlanner_eventsMigrated");
}

/** @deprecated Use {@link clearPlannerData} */
export function clearAllData(): void {
  clearPlannerData();
}
