import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
import type { DayData } from "@/lib/types";
import { getDayTaskSummary, isMeaningfulTask, mergeDayTasks } from "@/lib/tasks";
import { IncompleteDayIndicator } from "@/components/IncompleteDayIndicator";
import type { DayScheduleRange } from "@/lib/schedule";
import { WorkweekScheduleColumn } from "@/components/schedule/WorkweekScheduleColumn";
import {
  WEEK_SCHEDULE_SURFACE_CLASS,
  WEEK_SUMMARY_SURFACE_CLASS,
  WORKWEEK_DAY_HEADER_HEIGHT,
} from "@/lib/workweek";
import { cn } from "@/lib/utils";

interface WorkweekDayColumnProps {
  dateStr: string;
  dayData: DayData;
  range: DayScheduleRange;
  isToday: boolean;
  onOpenDay: (dateStr: string) => void;
}

function SummaryBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="type-ui font-semibold text-foreground">{label}</h3>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function WorkweekDayColumn({
  dateStr,
  dayData,
  range,
  isToday,
  onOpenDay,
}: WorkweekDayColumnProps) {
  const date = parseISO(`${dateStr}T12:00:00`);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isPastDay = dateStr < todayStr;
  const taskSummary = getDayTaskSummary(dayData);
  const allTasks = mergeDayTasks(dayData).filter(isMeaningfulTask);
  const focus = dayData.mainFocus.trim();
  const focusDone = dayData.mainFocusCompleted ?? false;

  return (
    <article
      className="flex min-w-[7rem] flex-1 basis-0 flex-col overflow-hidden rounded-xl border border-border bg-canvas"
      aria-labelledby={`workweek-day-${dateStr}`}
      data-testid={`workweek-column-${dateStr}`}
    >
      <button
        type="button"
        id={`workweek-day-${dateStr}`}
        onClick={() => onOpenDay(dateStr)}
        style={{ height: WORKWEEK_DAY_HEADER_HEIGHT }}
        className={cn(
          "box-border flex shrink-0 flex-col justify-center border-b border-border px-3 py-2.5 text-left transition-colors 2xl:px-4",
          "hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isToday
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : WEEK_SUMMARY_SURFACE_CLASS,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "type-label",
              isToday ? "text-primary-foreground/85" : "text-muted-foreground",
            )}
          >
            <span className="2xl:hidden">{format(date, "EEE")}</span>
            <span className="hidden 2xl:inline">{format(date, "EEEE")}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <IncompleteDayIndicator
              summary={taskSummary}
              variant="header"
              isToday={isToday}
              isPastDay={isPastDay}
            />
            {isToday ? (
              <span className="type-caption rounded-md bg-primary-foreground/15 px-1.5 py-0.5 font-semibold text-primary-foreground">
                Today
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-lead font-semibold tabular-nums tracking-tight",
              isToday ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {format(date, "d")}
          </span>
        </div>
      </button>

      <div
        className={cn(
          "week-column-summary h-32 shrink-0 border-b border-border px-3 py-2.5 2xl:h-[9.5rem] 2xl:px-4 2xl:py-3",
          WEEK_SUMMARY_SURFACE_CLASS,
        )}
      >
        <div className="space-y-3 2xl:space-y-4">
          <SummaryBlock label="Focus">
            {focus ? (
              <p
                className={cn(
                  "type-ui leading-snug",
                  focusDone && "text-foreground-subtle line-through",
                  !focusDone && "text-foreground",
                )}
              >
                {focus}
              </p>
            ) : (
              <p className="type-ui text-muted-foreground">No focus set</p>
            )}
          </SummaryBlock>

          <SummaryBlock label="Tasks">
            {allTasks.length === 0 ? (
              <p className="type-ui text-muted-foreground">Nothing here yet.</p>
            ) : (
              <ul className="overflow-hidden rounded-lg border border-border bg-surface-subtle">
                {allTasks.map((task, index) => (
                  <li
                    key={task.id}
                    className={cn(
                      "flex min-h-10 items-start gap-2 px-2 py-2 2xl:px-3",
                      index > 0 && "border-t border-border",
                    )}
                  >
                    <span className="mt-0.5 shrink-0" aria-hidden>
                      {task.completed ? (
                        <CheckCircle2
                          className="h-4 w-4 text-secondary"
                          strokeWidth={2}
                        />
                      ) : (
                        <Circle className="h-4 w-4 text-primary opacity-40" strokeWidth={2} />
                      )}
                    </span>
                    <span
                      className={cn(
                        "type-ui min-w-0 flex-1 leading-snug",
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
          </SummaryBlock>
        </div>
      </div>

      <div className={cn("shrink-0", WEEK_SCHEDULE_SURFACE_CLASS)}>
        <WorkweekScheduleColumn blocks={dayData.timeBlocks} range={range} />
      </div>
    </article>
  );
}
