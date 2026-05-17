import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonthsAnchor, isCurrentMonth } from "@/lib/month";
interface MonthNavBarProps {
  anchorDateStr: string;
  onAnchorChange: (dateStr: string) => void;
}

export function MonthNavBar({ anchorDateStr, onAnchorChange }: MonthNavBarProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const showToday = !isCurrentMonth(anchorDateStr);

  return (
    <div
      className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-2 py-1 sm:px-3"
      data-testid="month-nav-bar"
    >
      <button
        type="button"
        onClick={() => onAnchorChange(addMonthsAnchor(anchorDateStr, -1))}
        data-testid="button-prev-month"
        title="Previous month"
        aria-label="Previous month"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      <div className="min-w-0 flex-1" aria-hidden />

      <button
        type="button"
        onClick={() => onAnchorChange(addMonthsAnchor(anchorDateStr, 1))}
        data-testid="button-next-month"
        title="Next month"
        aria-label="Next month"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      {showToday ? (
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
