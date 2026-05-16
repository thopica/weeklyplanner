import type { DayData, Task } from "./types";

export interface DayTaskSummary {
  total: number;
  completed: number;
  openCount: number;
  hasTasks: boolean;
  allDone: boolean;
  hasOpen: boolean;
}

export function isMeaningfulTask(task: Task): boolean {
  return task.text.trim().length > 0;
}

/** Merge priority + general lists for display (high-priority wins on duplicate ids). */
export function getDayTaskSummary(day: DayData | undefined): DayTaskSummary {
  const all = mergeDayTasks(
    day ?? { highPriorityTasks: [], generalTasks: [] } as Pick<
      DayData,
      "highPriorityTasks" | "generalTasks"
    >,
  ).filter(isMeaningfulTask);
  const total = all.length;
  const completed = all.filter((t) => t.completed).length;
  const openCount = total - completed;
  return {
    total,
    completed,
    openCount,
    hasTasks: total > 0,
    allDone: total > 0 && openCount === 0,
    hasOpen: openCount > 0,
  };
}

export function mergeDayTasks(day: Pick<DayData, "highPriorityTasks" | "generalTasks">): Task[] {
  const hp = day.highPriorityTasks ?? [];
  const gen = day.generalTasks ?? [];
  const hpIds = new Set(hp.map((t) => t.id));
  return [...hp, ...gen.filter((t) => !hpIds.has(t.id))];
}

/**
 * Split a unified task list back into stored buckets.
 * Preserves which list each task came from; new tasks go to high-priority.
 */
export function partitionDayTasks(
  tasks: Task[],
  previous: Pick<DayData, "highPriorityTasks" | "generalTasks">,
): Pick<DayData, "highPriorityTasks" | "generalTasks"> {
  const hpIds = new Set((previous.highPriorityTasks ?? []).map((t) => t.id));
  const genIds = new Set((previous.generalTasks ?? []).map((t) => t.id));
  const highPriorityTasks: Task[] = [];
  const generalTasks: Task[] = [];

  for (const task of tasks) {
    if (genIds.has(task.id) && !hpIds.has(task.id)) {
      generalTasks.push(task);
    } else {
      highPriorityTasks.push(task);
    }
  }

  return { highPriorityTasks, generalTasks };
}

export function createTaskId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `task-${crypto.randomUUID()}`
    : `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
