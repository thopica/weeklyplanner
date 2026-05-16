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

function appendTask(day: DayData, task: Task, bucket: "highPriority" | "general"): DayData {
  const existingIds = new Set(mergeDayTasks(day).map((t) => t.id));
  if (existingIds.has(task.id)) return day;

  if (bucket === "highPriority") {
    return { ...day, highPriorityTasks: [...day.highPriorityTasks, task] };
  }
  return { ...day, generalTasks: [...day.generalTasks, task] };
}

function bucketForTask(day: DayData, taskId: string): "highPriority" | "general" {
  const inHighPriority = day.highPriorityTasks.some((t) => t.id === taskId);
  return inHighPriority ? "highPriority" : "general";
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

  const targetDay = cloneDay(data.days[toDateStr]);
  const targetIds = new Set(mergeDayTasks(targetDay).map((t) => t.id));
  if (targetIds.has(taskId)) return null;

  const bucket = bucketForTask(fromDay, taskId);

  const next: PlannerData = {
    ...data,
    days: { ...data.days },
  };

  next.days[fromDateStr] = removeTaskById(cloneDay(fromDay), taskId);
  next.days[toDateStr] = appendTask(targetDay, task, bucket);

  return next;
}
