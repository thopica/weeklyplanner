import { format, startOfWeek, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavBarProps {
  selectedDate: Date;
  onAnchorChange: (dateStr: string) => void;
}

/** Week prev/next/today controls (no day pills); matches WeeklyRibbon chrome. */
export function WeekNavBar({ selectedDate, onAnchorChange }: WeekNavBarProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isCurrentWeek = isSameDay(weekStart, todayWeekStart);

  return (
    <div
      className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-2 py-1 sm:px-3"
      data-testid="week-nav-bar"
    >
      <button
        type="button"
        onClick={() => onAnchorChange(format(subWeeks(selectedDate, 1), "yyyy-MM-dd"))}
        data-testid="button-prev-week"
        title="Previous week"
        aria-label="Previous week"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      <div className="min-w-0 flex-1" aria-hidden />

      <button
        type="button"
        onClick={() => onAnchorChange(format(addWeeks(selectedDate, 1), "yyyy-MM-dd"))}
        data-testid="button-next-week"
        title="Next week"
        aria-label="Next week"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      {!isCurrentWeek ? (
        <button
          type="button"
          onClick={() => onAnchorChange(todayStr)}
          data-testid="button-go-today"
          title="Go to today"
          className="type-label ml-0.5 shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-primary-foreground"
        >
          Today
        </button>
      ) : null}
    </div>
  );
}
