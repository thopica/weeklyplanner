import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { isQuantifiableHabitMet, normalizeHabitLog } from "@/lib/habits";
import type { DayData, HabitDefinition, PlannerData, Task } from "@/lib/types";
import { parseLocalDateStr } from "@/lib/dates";
import { getDayData, todayStr } from "@/lib/storage";
import { isMeaningfulTask } from "@/lib/tasks";

export type InsightsPeriodDays = 7 | 30 | 90;

export interface InsightsDateRange {
  periodDays: InsightsPeriodDays;
  /** Inclusive start (yyyy-MM-dd). */
  startDateStr: string;
  /** Inclusive end (yyyy-MM-dd), usually today. */
  endDateStr: string;
  /** All calendar days in range, oldest first. */
  dateStrs: string[];
}

export interface TaskDaySnapshot {
  dateStr: string;
  total: number;
  completed: number;
  highPriorityTotal: number;
  highPriorityCompleted: number;
  generalTotal: number;
  generalCompleted: number;
  sameDayPlannedCount: number;
  backfillPlannedCount: number;
  isCleanSweep: boolean;
  hasOpenTasks: boolean;
}

export interface TaskInsights {
  range: InsightsDateRange;
  totalTasks: number;
  completedTasks: number;
  finishRate: number | null;
  activePlanningDays: number;
  calendarDays: number;
  cleanSweepDays: number;
  openBacklogDayCount: number;
  openBacklogTaskCount: number;
  oldestOpenBacklogDateStr: string | null;
  sameDayPlanningPercent: number | null;
  highPriorityFinishRate: number | null;
  generalFinishRate: number | null;
  avgTasksPerActiveDay: number | null;
  weeklyBuckets: { weekStartStr: string; label: string; finishRate: number | null }[];
  daySnapshots: TaskDaySnapshot[];
}

export interface HabitDayStatus {
  dateStr: string;
  met: boolean;
}

export interface HabitInsightRow {
  habit: HabitDefinition;
  currentStreak: number;
  bestStreakInRange: number;
  hitRate: number | null;
  daysEligible: number;
  daysMet: number;
  /** Eligible days in the selected period, oldest first — for streak visualization. */
  periodTimeline: HabitDayStatus[];
  avgActual: number | null;
  target: number | null;
}

export interface HabitInsights {
  range: InsightsDateRange;
  habits: HabitInsightRow[];
  averageHitRate: number | null;
  bestCurrentStreak: number;
  perfectHabitDays: number;
}

export interface InsightsSummary {
  taskFinishRate: number | null;
  cleanSweepDays: number;
  habitHitRate: number | null;
  bestHabitStreak: number;
  hasEnoughData: boolean;
}

function taskCreatedDateStr(task: Task): string {
  try {
    return format(new Date(task.createdAt), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

function habitExistedOnDate(habit: HabitDefinition, dateStr: string): boolean {
  try {
    const created = format(new Date(habit.createdAt), "yyyy-MM-dd");
    return dateStr >= created;
  } catch {
    return true;
  }
}

function isHabitMetOnDay(
  habit: HabitDefinition,
  day: DayData | undefined,
): boolean {
  if (!day) return false;
  const log = day.habitLogs?.[habit.id];
  if (habit.kind === "boolean") {
    return Boolean(log?.completed);
  }
  return isQuantifiableHabitMet(normalizeHabitLog(log, habit), habit);
}

export function getInsightsDateRange(periodDays: InsightsPeriodDays): InsightsDateRange {
  const endDateStr = todayStr();
  const end = parseLocalDateStr(endDateStr);
  const start = subDays(end, periodDays - 1);
  const startDateStr = format(start, "yyyy-MM-dd");
  const dateStrs: string[] = [];
  for (let i = 0; i < periodDays; i++) {
    dateStrs.push(format(addDays(start, i), "yyyy-MM-dd"));
  }
  return { periodDays, startDateStr, endDateStr, dateStrs };
}

function analyzeTasksForDay(
  dateStr: string,
  day: DayData | undefined,
): TaskDaySnapshot {
  const hp = (day?.highPriorityTasks ?? []).filter(isMeaningfulTask);
  const hpIds = new Set(hp.map((t) => t.id));
  const gen = (day?.generalTasks ?? []).filter(
    (t) => isMeaningfulTask(t) && !hpIds.has(t.id),
  );
  const all = [...hp, ...gen];
  const completed = all.filter((t) => t.completed).length;
  const hpDone = hp.filter((t) => t.completed).length;
  const genDone = gen.filter((t) => t.completed).length;

  let sameDayPlannedCount = 0;
  let backfillPlannedCount = 0;
  for (const t of all) {
    const created = taskCreatedDateStr(t);
    if (!created) continue;
    if (created === dateStr) sameDayPlannedCount += 1;
    else if (created > dateStr) backfillPlannedCount += 1;
  }

  const total = all.length;
  const open = all.filter((t) => !t.completed).length;

  return {
    dateStr,
    total,
    completed,
    highPriorityTotal: hp.length,
    highPriorityCompleted: hpDone,
    generalTotal: gen.length,
    generalCompleted: genDone,
    sameDayPlannedCount,
    backfillPlannedCount,
    isCleanSweep: total > 0 && open === 0,
    hasOpenTasks: open > 0,
  };
}

export function aggregateTaskInsights(
  data: PlannerData,
  range: InsightsDateRange,
): TaskInsights {
  const today = range.endDateStr;
  const daySnapshots = range.dateStrs.map((dateStr) =>
    analyzeTasksForDay(dateStr, getDayData(dateStr)),
  );

  let totalTasks = 0;
  let completedTasks = 0;
  let hpTotal = 0;
  let hpCompleted = 0;
  let genTotal = 0;
  let genCompleted = 0;
  let sameDayPlanned = 0;
  let backfillPlanned = 0;
  let activePlanningDays = 0;
  let cleanSweepDays = 0;
  let openBacklogDayCount = 0;
  let openBacklogTaskCount = 0;
  let oldestOpenBacklogDateStr: string | null = null;

  for (const snap of daySnapshots) {
    totalTasks += snap.total;
    completedTasks += snap.completed;
    hpTotal += snap.highPriorityTotal;
    hpCompleted += snap.highPriorityCompleted;
    genTotal += snap.generalTotal;
    genCompleted += snap.generalCompleted;
    sameDayPlanned += snap.sameDayPlannedCount;
    backfillPlanned += snap.backfillPlannedCount;
    if (snap.total > 0) activePlanningDays += 1;
    if (snap.isCleanSweep) cleanSweepDays += 1;

    if (snap.hasOpenTasks && snap.dateStr < today) {
      openBacklogDayCount += 1;
      const openCount = snap.total - snap.completed;
      openBacklogTaskCount += openCount;
      if (
        oldestOpenBacklogDateStr === null ||
        snap.dateStr < oldestOpenBacklogDateStr
      ) {
        oldestOpenBacklogDateStr = snap.dateStr;
      }
    }
  }

  const plannedWithTiming = sameDayPlanned + backfillPlanned;
  const weeklyMap = new Map<string, { total: number; completed: number }>();

  for (const snap of daySnapshots) {
    const weekStart = format(
      startOfWeek(parseLocalDateStr(snap.dateStr), { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    );
    const bucket = weeklyMap.get(weekStart) ?? { total: 0, completed: 0 };
    bucket.total += snap.total;
    bucket.completed += snap.completed;
    weeklyMap.set(weekStart, bucket);
  }

  const weeklyBuckets = [...weeklyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStartStr, bucket]) => ({
      weekStartStr,
      label: format(parseLocalDateStr(weekStartStr), "MMM d"),
      finishRate:
        bucket.total === 0 ? null : Math.round((bucket.completed / bucket.total) * 100),
    }));

  return {
    range,
    totalTasks,
    completedTasks,
    finishRate: totalTasks === 0 ? null : Math.round((completedTasks / totalTasks) * 100),
    activePlanningDays,
    calendarDays: range.dateStrs.length,
    cleanSweepDays,
    openBacklogDayCount,
    openBacklogTaskCount,
    oldestOpenBacklogDateStr,
    sameDayPlanningPercent:
      plannedWithTiming === 0
        ? null
        : Math.round((sameDayPlanned / plannedWithTiming) * 100),
    highPriorityFinishRate:
      hpTotal === 0 ? null : Math.round((hpCompleted / hpTotal) * 100),
    generalFinishRate:
      genTotal === 0 ? null : Math.round((genCompleted / genTotal) * 100),
    avgTasksPerActiveDay:
      activePlanningDays === 0 ? null : Math.round((totalTasks / activePlanningDays) * 10) / 10,
    weeklyBuckets,
    daySnapshots,
  };
}

function streakEndingAt(
  dateStrs: string[],
  metByDate: Map<string, boolean>,
): number {
  let streak = 0;
  for (let i = dateStrs.length - 1; i >= 0; i--) {
    if (metByDate.get(dateStrs[i])) streak += 1;
    else break;
  }
  return streak;
}

function bestStreakInRange(dateStrs: string[], metByDate: Map<string, boolean>): number {
  let best = 0;
  let current = 0;
  for (const d of dateStrs) {
    if (metByDate.get(d)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function periodTimelineStatuses(
  eligibleDates: string[],
  metByDate: Map<string, boolean>,
): HabitDayStatus[] {
  return eligibleDates.map((dateStr) => ({
    dateStr,
    met: metByDate.get(dateStr) ?? false,
  }));
}

export function aggregateHabitInsights(
  data: PlannerData,
  habits: HabitDefinition[],
  range: InsightsDateRange,
): HabitInsights {
  const rows: HabitInsightRow[] = habits.map((habit) => {
    const eligibleDates = range.dateStrs.filter((d) => habitExistedOnDate(habit, d));
    const metByDate = new Map<string, boolean>();
    let daysMet = 0;
    let actualSum = 0;
    let actualCount = 0;
    const target = habit.kind === "quantifiable" ? habit.target ?? null : null;

    for (const dateStr of eligibleDates) {
      const day = getDayData(dateStr);
      const met = isHabitMetOnDay(habit, day);
      metByDate.set(dateStr, met);
      if (met) daysMet += 1;
      if (habit.kind === "quantifiable" && day) {
        const log = normalizeHabitLog(day.habitLogs?.[habit.id], habit);
        const actual = log.actual;
        if (typeof actual === "number" && Number.isFinite(actual)) {
          actualSum += actual;
          actualCount += 1;
        }
      }
    }

    return {
      habit,
      currentStreak: streakEndingAt(eligibleDates, metByDate),
      bestStreakInRange: bestStreakInRange(eligibleDates, metByDate),
      hitRate:
        eligibleDates.length === 0
          ? null
          : Math.round((daysMet / eligibleDates.length) * 100),
      daysEligible: eligibleDates.length,
      daysMet,
      periodTimeline: periodTimelineStatuses(eligibleDates, metByDate),
      avgActual: actualCount === 0 ? null : Math.round(actualSum / actualCount),
      target: typeof target === "number" ? target : null,
    };
  });

  const withRates = rows.filter((r) => r.hitRate !== null);
  const averageHitRate =
    withRates.length === 0
      ? null
      : Math.round(withRates.reduce((s, r) => s + (r.hitRate ?? 0), 0) / withRates.length);

  const bestCurrentStreak =
    rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.currentStreak));

  let perfectHabitDays = 0;
  if (habits.length > 0) {
    for (const dateStr of range.dateStrs) {
      const day = getDayData(dateStr);
      const activeHabits = habits.filter((h) => habitExistedOnDate(h, dateStr));
      if (activeHabits.length === 0) continue;
      if (activeHabits.every((h) => isHabitMetOnDay(h, day))) perfectHabitDays += 1;
    }
  }

  return {
    range,
    habits: rows,
    averageHitRate,
    bestCurrentStreak,
    perfectHabitDays,
  };
}

export function buildInsightsSummary(
  tasks: TaskInsights,
  habits: HabitInsights,
): InsightsSummary {
  const hasEnoughData =
    tasks.activePlanningDays >= 3 ||
    habits.habits.some((h) => h.daysEligible >= 3);

  return {
    taskFinishRate: tasks.finishRate,
    cleanSweepDays: tasks.cleanSweepDays,
    habitHitRate: habits.averageHitRate,
    bestHabitStreak: habits.bestCurrentStreak,
    hasEnoughData,
  };
}

export function formatInsightsBacklogAge(dateStr: string, today: string): string {
  const days = differenceInCalendarDays(parseLocalDateStr(today), parseLocalDateStr(dateStr));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
