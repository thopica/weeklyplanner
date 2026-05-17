import { format } from "date-fns";
import { getDayData } from "@/lib/storage";
import {
  formatMonthTitle,
  getMonthGrid,
  getMonthGridRows,
  MONTH_WEEKDAY_LABELS,
} from "@/lib/month";
import { MonthDayCell } from "@/components/month/MonthDayCell";

interface MonthCalendarGridProps {
  anchorDateStr: string;
  onOpenDay: (dateStr: string) => void;
}

export function MonthCalendarGrid({ anchorDateStr, onOpenDay }: MonthCalendarGridProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const rows = getMonthGridRows(getMonthGrid(anchorDateStr));
  const monthLabel = formatMonthTitle(anchorDateStr);

  return (
    <section
      className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-2 py-3 sm:px-4 sm:py-3"
      aria-label={`Month view, ${monthLabel}`}
      data-testid="month-calendar-grid"
    >
      <div
        className="sticky top-0 z-10 grid shrink-0 grid-cols-7 gap-1 border-b border-border bg-background pb-2 sm:gap-1.5"
        role="row"
      >
        {MONTH_WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            role="columnheader"
            className="flex items-center justify-center py-1"
          >
            <span className="type-label text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 pt-2 sm:gap-1.5">
        {rows.map((week, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            className="grid shrink-0 grid-cols-7 gap-1 sm:gap-1.5"
            role="row"
            data-testid={`month-week-row-${weekIndex}`}
          >
            {week.map((cell) => (
              <MonthDayCell
                key={cell.dateStr}
                dateStr={cell.dateStr}
                dayData={getDayData(cell.dateStr)}
                inMonth={cell.inMonth}
                isToday={cell.dateStr === todayStr}
                onOpenDay={onOpenDay}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

