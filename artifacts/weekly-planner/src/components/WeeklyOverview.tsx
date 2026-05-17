import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { getDayData, getHabits } from "@/lib/storage";
import { isQuantifiableHabitMet, normalizeHabitLog } from "@/lib/habits";
import { isMeaningfulTask, mergeDayTasks } from "@/lib/tasks";
import type { HabitDefinition } from "@/lib/types";

interface WeeklyOverviewProps {
  selectedDateStr: string;
}

function habitsMetForDay(
  dateStr: string,
  habitDefs: HabitDefinition[],
): { completed: number; total: number } {
  const active = habitDefs.filter((h) => habitExistedOnDate(h, dateStr));
  if (active.length === 0) return { completed: 0, total: 0 };
  const data = getDayData(dateStr);
  const logs = data.habitLogs ?? {};
  let completed = 0;
  for (const habit of active) {
    const log = logs[habit.id];
    if (habit.kind === "boolean") {
      if (log?.completed) completed += 1;
    } else if (isQuantifiableHabitMet(normalizeHabitLog(log, habit), habit)) {
      completed += 1;
    }
  }
  return { completed, total: active.length };
}

function habitExistedOnDate(habit: HabitDefinition, dateStr: string): boolean {
  try {
    const created = format(new Date(habit.createdAt), "yyyy-MM-dd");
    return dateStr >= created;
  } catch {
    return true;
  }
}

export function WeeklyOverview({ selectedDateStr }: WeeklyOverviewProps) {
  const selectedDate = parseISO(`${selectedDateStr}T12:00:00`);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const habitDefs = getHabits();

  return (
    <div className="mt-8 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-primary">
        Weekly Overview
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        {days.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const data = getDayData(dateStr);
          const allTasks = mergeDayTasks(data).filter(isMeaningfulTask);
          const completedTasks = allTasks.filter((t) => t.completed).length;
          const totalTasks = allTasks.length;
          const progress =
            totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
          const { completed: habitsCompleted, total: habitsTotal } = habitsMetForDay(
            dateStr,
            habitDefs,
          );

          return (
            <div
              key={dateStr}
              className={`rounded-xl border p-4 ${
                isSameDay(date, selectedDate)
                  ? "border-primary bg-primary/5"
                  : "border-card-border bg-background/50"
              }`}
            >
              <div className="mb-3 text-center">
                <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  {format(date, "EEE")}
                </div>
                <div className="font-serif text-xl text-foreground">{format(date, "d")}</div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Tasks</span>
                    <span className="font-medium text-foreground">
                      {completedTasks}/{totalTasks}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {habitsTotal > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-xs text-muted-foreground">Habits</div>
                    <div className="text-xs font-medium text-primary">
                      {habitsCompleted}/{habitsTotal}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
