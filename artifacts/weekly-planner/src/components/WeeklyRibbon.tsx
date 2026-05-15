import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { PlannerData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeeklyRibbonProps {
  selectedDate: Date;
  onSelectDate: (dateStr: string) => void;
  plannerData: PlannerData;
  scheduleVisible: boolean;
  onToggleSchedule: () => void;
}

export function WeeklyRibbon({
  selectedDate,
  onSelectDate,
  plannerData,
  scheduleVisible,
  onToggleSchedule,
}: WeeklyRibbonProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isCurrentWeek = isSameDay(weekStart, todayWeekStart);

  const goToPrevWeek = () => {
    onSelectDate(format(subWeeks(selectedDate, 1), "yyyy-MM-dd"));
  };

  const goToNextWeek = () => {
    onSelectDate(format(addWeeks(selectedDate, 1), "yyyy-MM-dd"));
  };

  const goToToday = () => {
    onSelectDate(todayStr);
  };

  const getTaskCount = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const data = plannerData.days[dateStr];
    if (!data) return { total: 0, completed: 0 };
    const all = [...data.highPriorityTasks, ...data.generalTasks];
    return { total: all.length, completed: all.filter((t) => t.completed).length };
  };

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 border-b border-border bg-card px-2 py-1"
      data-testid="weekly-ribbon"
    >
      <button
        type="button"
        onClick={goToPrevWeek}
        data-testid="button-prev-week"
        title="Previous week"
        aria-label="Previous week"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-hide">
        {days.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isSelected = isSameDay(date, selectedDate);
          const isToday = dateStr === todayStr;
          const { total, completed } = getTaskCount(date);
          const hasOpenTasks = total - completed > 0;
          const allDone = total > 0 && completed === total;

          return (
            <button
              key={dateStr}
              type="button"
              data-testid={`day-button-${dateStr}`}
              onClick={() => onSelectDate(dateStr)}
              className="flex min-h-[34px] min-w-[40px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 font-sans transition-colors"
              style={{
                background: isSelected
                  ? "hsl(var(--primary))"
                  : isToday
                    ? "hsl(var(--accent))"
                    : "transparent",
                color: isSelected
                  ? "hsl(var(--primary-foreground))"
                  : isToday
                    ? "hsl(var(--accent-foreground))"
                    : "hsl(var(--muted-foreground))",
                outline: isToday && !isSelected ? "2px solid hsl(var(--primary))" : "none",
                outlineOffset: "-2px",
              }}
            >
              <span className="type-label leading-none">
                {format(date, "EEE")}
              </span>
              <span className="font-serif text-lead font-bold leading-none tabular-nums">
                {format(date, "d")}
              </span>
              <span className="flex h-1.5 w-full items-center justify-center" aria-hidden>
                {hasOpenTasks ? (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: isSelected
                        ? "hsl(var(--primary-foreground) / 0.85)"
                        : "hsl(var(--primary))",
                    }}
                  />
                ) : allDone ? (
                  <span
                    className="type-caption font-bold leading-none"
                    style={{
                      color: isSelected
                        ? "hsl(var(--primary-foreground) / 0.75)"
                        : "hsl(var(--secondary))",
                    }}
                  >
                    ✓
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={goToNextWeek}
        data-testid="button-next-week"
        title="Next week"
        aria-label="Next week"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      {!isCurrentWeek && (
        <button
          type="button"
          onClick={goToToday}
          data-testid="button-go-today"
          title="Go to today"
          className="type-label ml-0.5 shrink-0 rounded-lg px-2.5 py-1.5"
          style={{
            background: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          Today
        </button>
      )}

      <button
        type="button"
        onClick={onToggleSchedule}
        data-testid="button-toggle-schedule-ribbon"
        title={scheduleVisible ? "Hide schedule" : "Show schedule"}
        aria-label={scheduleVisible ? "Hide schedule" : "Show schedule"}
        aria-pressed={scheduleVisible}
        className={cn(
          "ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          scheduleVisible
            ? "bg-accent text-accent-foreground hover:bg-accent/80"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
