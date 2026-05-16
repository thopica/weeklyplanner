import type { DayData, PlannerData, Task } from "./types";
import { defaultDayData } from "./types";
import { mergeDayTasks } from "./tasks";

function cloneDay(raw: DayData | undefined): DayData {
  return raw ? structuredClone(raw) : structuredClone(defaultDayData);
}

function removeTaskById(day: DayData, taskId: string): DayData {
  return {
    ...day,
    highPriorityTasks: day.highPriorityTasks.filter((t) => t.id !== taskId),
    generalTasks: day.generalTasks.filter((t) => t.id !== taskId),
  };
}

function appendToGeneralTasks(day: DayData, task: Task): DayData {
  const existingIds = new Set(mergeDayTasks(day).map((t) => t.id));
  if (existingIds.has(task.id)) return day;
  return {
    ...day,
    generalTasks: [...day.generalTasks, task],
  };
}

/**
 * Move a task from one day to another. Returns updated planner data, or null if no-op / not found.
 */
export function moveTaskBetweenDays(
  data: PlannerData,
  taskId: string,
  fromDateStr: string,
  toDateStr: string,
): PlannerData | null {
  if (fromDateStr === toDateStr) return null;

  const fromDay = data.days[fromDateStr];
  if (!fromDay) return null;

  const task = mergeDayTasks(fromDay).find((t) => t.id === taskId);
  if (!task) return null;

  const next: PlannerData = {
    ...data,
    days: { ...data.days },
  };

  next.days[fromDateStr] = removeTaskById(cloneDay(fromDay), taskId);
  next.days[toDateStr] = appendToGeneralTasks(cloneDay(next.days[toDateStr]), task);

  return next;
}
