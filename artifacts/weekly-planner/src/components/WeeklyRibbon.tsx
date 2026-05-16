import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { PlannerData } from "@/lib/types";
import { getDayTaskSummary } from "@/lib/tasks";
import { IncompleteDayIndicator } from "@/components/IncompleteDayIndicator";
import { cn } from "@/lib/utils";

interface WeeklyRibbonProps {
  selectedDate: Date;
  onSelectDate: (dateStr: string) => void;
  plannerData: PlannerData;
  workweekOnly?: boolean;
  scheduleVisible?: boolean;
  onToggleSchedule?: () => void;
}

export function WeeklyRibbon({
  selectedDate,
  onSelectDate,
  plannerData,
  workweekOnly = false,
  scheduleVisible = false,
  onToggleSchedule,
}: WeeklyRibbonProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const days = workweekOnly ? allDays.slice(0, 5) : allDays;

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
          const isPastDay = dateStr < todayStr;
          const summary = getDayTaskSummary(plannerData.days[dateStr]);

          return (
            <button
              key={dateStr}
              type="button"
              data-testid={`day-button-${dateStr}`}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "flex min-h-[34px] min-w-[40px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 font-sans transition-colors",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected &&
                  isToday &&
                  "bg-accent text-accent-foreground ring-2 ring-inset ring-primary",
                !isSelected && !isToday && "text-muted-foreground",
              )}
            >
              <span className="type-label leading-none">
                {format(date, "EEE")}
              </span>
              <span className="text-lead font-bold leading-none tabular-nums">
                {format(date, "d")}
              </span>
              <IncompleteDayIndicator
                summary={summary}
                variant="ribbon"
                isSelected={isSelected}
                isToday={isToday}
                isPastDay={isPastDay}
              />
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
          className="type-label ml-0.5 shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-primary-foreground"
        >
          Today
        </button>
      )}

      {onToggleSchedule ? (
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
      ) : null}
    </div>
  );
}
