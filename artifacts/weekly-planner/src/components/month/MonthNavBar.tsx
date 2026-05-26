import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { addMonthsAnchor, isCurrentMonth } from "@/lib/month";
import { CategoryFilter } from "@/components/month/CategoryFilter";
import { useMonthView } from "@/components/month/MonthViewProvider";
import { cn } from "@/lib/utils";

interface MonthNavBarProps {
  anchorDateStr: string;
  onAnchorChange: (dateStr: string) => void;
  /** Bumped on data changes; forwarded to CategoryFilter so its list refreshes. */
  dataVersion: number;
}

export function MonthNavBar({
  anchorDateStr,
  onAnchorChange,
  dataVersion,
}: MonthNavBarProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const showToday = !isCurrentMonth(anchorDateStr);
  const { importantOnly, toggleImportantOnly } = useMonthView();

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

      <div className="min-w-0 flex-1" aria-hidden />

      <button
        type="button"
        onClick={toggleImportantOnly}
        aria-pressed={importantOnly}
        title={
          importantOnly
            ? "Showing only important events"
            : "Show only important events"
        }
        data-testid="button-important-toggle"
        className={cn(
          "type-label flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 transition-colors hover:bg-accent",
          importantOnly
            ? "bg-surface-accent text-foreground"
            : "text-muted-foreground",
        )}
      >
        <Flag
          className="h-3.5 w-3.5"
          strokeWidth={2}
          fill={importantOnly ? "currentColor" : "none"}
        />
        <span>Important</span>
      </button>

      <CategoryFilter dataVersion={dataVersion} />
    </div>
  );
}
