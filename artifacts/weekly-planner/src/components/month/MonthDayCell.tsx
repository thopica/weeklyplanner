import { format, parseISO } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
import type { DayData } from "@/lib/types";
import { getDayTaskSummary, isMeaningfulTask, mergeDayTasks } from "@/lib/tasks";
import { IncompleteDayIndicator } from "@/components/IncompleteDayIndicator";
import {
  MONTH_CELL_TASK_HEIGHT,
  MONTH_DAY_HEADER_HEIGHT,
} from "@/lib/month";
import { cn } from "@/lib/utils";

interface MonthDayCellProps {
  dateStr: string;
  dayData: DayData;
  inMonth: boolean;
  isToday: boolean;
  onOpenDay: (dateStr: string) => void;
}

export function MonthDayCell({
  dateStr,
  dayData,
  inMonth,
  isToday,
  onOpenDay,
}: MonthDayCellProps) {
  const date = parseISO(`${dateStr}T12:00:00`);
  const isPastDay = dateStr < format(new Date(), "yyyy-MM-dd");
  const taskSummary = getDayTaskSummary(dayData);
  const allTasks = mergeDayTasks(dayData).filter(isMeaningfulTask);

  return (
    <article
      className={cn(
        "flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card",
        !inMonth && "bg-surface-subtle/50",
      )}
      aria-labelledby={`month-day-${dateStr}`}
      data-testid={`month-cell-${dateStr}`}
    >
      <button
        type="button"
        id={`month-day-${dateStr}`}
        onClick={() => onOpenDay(dateStr)}
        style={{ height: MONTH_DAY_HEADER_HEIGHT }}
        className={cn(
          "flex shrink-0 flex-col justify-center border-b border-border px-2 py-2 text-left transition-colors sm:px-3",
          "hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isToday && "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "text-lead font-semibold tabular-nums tracking-tight",
              isToday
                ? "text-primary-foreground"
                : inMonth
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {format(date, "d")}
          </span>
          <div className="flex items-center gap-1">
            <IncompleteDayIndicator
              summary={taskSummary}
              variant="header"
              isToday={isToday}
              isPastDay={isPastDay}
            />
            {isToday ? (
              <span className="type-caption rounded-md bg-primary-foreground/15 px-1 py-0.5 font-semibold text-primary-foreground">
                Today
              </span>
            ) : null}
          </div>
        </div>
      </button>

      <div
        className="shrink-0 overflow-y-auto px-2 py-2 sm:px-3"
        style={{ height: MONTH_CELL_TASK_HEIGHT }}
      >
        {allTasks.length === 0 ? (
          <p className="type-caption text-muted-foreground">No tasks</p>
        ) : (
          <ul className="space-y-1.5">
            {allTasks.map((task) => (
              <li
                key={task.id}
                className="flex min-h-8 items-start gap-1.5 sm:gap-2"
              >
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {task.completed ? (
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-secondary sm:h-4 sm:w-4"
                      strokeWidth={2}
                    />
                  ) : (
                    <Circle
                      className="h-3.5 w-3.5 text-primary opacity-40 sm:h-4 sm:w-4"
                      strokeWidth={2}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "type-caption min-w-0 flex-1 leading-snug sm:type-ui",
                    task.completed
                      ? "text-foreground-subtle line-through"
                      : "text-foreground",
                  )}
                >
                  {task.text.trim() || "Untitled task"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
