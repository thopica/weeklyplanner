import type { HabitDayLog, HabitDefinition } from "./types";

function finiteNonNegative(n: unknown): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return undefined;
  return n;
}

/** Read actual count. Quantifiable habits ignore legacy `value` (prevents edit bugs). */
export function getHabitActual(
  log: HabitDayLog | undefined,
  habit?: HabitDefinition,
): number | undefined {
  if (!log) return undefined;
  if (habit?.kind === "quantifiable") {
    return finiteNonNegative(log.actual);
  }
  return finiteNonNegative(log.actual) ?? finiteNonNegative(log.value);
}

/** Daily goal from habit definition (settings); falls back to per-day log for legacy data. */
export function getQuantifiableGoal(
  habit: HabitDefinition,
  log?: HabitDayLog,
): number | undefined {
  if (habit.kind !== "quantifiable") return undefined;
  const fromDef = finiteNonNegative(habit.target);
  if (fromDef !== undefined) return fromDef;
  if (!log) return undefined;
  return finiteNonNegative(log.goal);
}

/** Met when goal is set (> 0) and actual >= goal. */
export function isQuantifiableHabitMet(
  log: HabitDayLog | undefined,
  habit: HabitDefinition,
): boolean {
  const goal = getQuantifiableGoal(habit, log);
  const actual = getHabitActual(log, habit);
  if (goal === undefined || goal <= 0) return false;
  if (actual === undefined) return false;
  return actual >= goal;
}

/** Strip legacy fields and return a clean log for storage. */
export function normalizeHabitLog(
  log: HabitDayLog | undefined,
  habit?: HabitDefinition,
): HabitDayLog {
  if (!log) return {};
  const next: HabitDayLog = {};
  if (log.completed !== undefined) next.completed = log.completed;

  const actual = getHabitActual(log, habit);
  if (actual !== undefined) next.actual = actual;

  if (habit?.kind !== "quantifiable" && finiteNonNegative(log.goal) !== undefined) {
    next.goal = log.goal;
  }

  return next;
}
