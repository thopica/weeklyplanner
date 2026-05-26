import { useMemo } from "react";
import { format } from "date-fns";
import { getDayData } from "@/lib/storage";
import { dayEndExclusive, getEvents } from "@/lib/events";
import type { CalendarEvent, DayData } from "@/lib/types";
import {
  formatMonthTitle,
  getMonthGrid,
  getMonthGridRows,
  MONTH_WEEKDAY_LABELS,
} from "@/lib/month";
import { MonthDayCell } from "@/components/month/MonthDayCell";

interface MonthCalendarGridProps {
  anchorDateStr: string;
  /** Bumped by the page on data changes so derived state re-runs. */
  dataVersion: number;
  onRequestCreate: (dateStr: string) => void;
  onRequestEdit: (eventId: string) => void;
}

function eventTouchesDay(event: CalendarEvent, dateStr: string): boolean {
  const dayStart = `${dateStr}T00:00:00`;
  const dayEnd = dayEndExclusive(dateStr);
  return event.startsAt < dayEnd && event.endsAt > dayStart;
}

export function MonthCalendarGrid({
  anchorDateStr,
  dataVersion,
  onRequestCreate,
  onRequestEdit,
}: MonthCalendarGridProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const cells = useMemo(() => getMonthGrid(anchorDateStr), [anchorDateStr]);
  const rows = useMemo(() => getMonthGridRows(cells), [cells]);
  const monthLabel = useMemo(
    () => formatMonthTitle(anchorDateStr),
    [anchorDateStr],
  );

  const eventsByDay = useMemo(() => {
    // Single read of the events store, then 42 cell-scoped overlap filters.
    void dataVersion;
    const events = getEvents();
    const map = new Map<string, CalendarEvent[]>();
    for (const cell of cells) {
      map.set(
        cell.dateStr,
        events.filter((e) => eventTouchesDay(e, cell.dateStr)),
      );
    }
    return map;
  }, [cells, dataVersion]);

  const dayDataByDate = useMemo(() => {
    void dataVersion;
    const map = new Map<string, DayData>();
    for (const cell of cells) {
      map.set(cell.dateStr, getDayData(cell.dateStr));
    }
    return map;
  }, [cells, dataVersion]);

  return (
    <section
      className="planner-scroll flex min-h-0 w-full flex-1 flex-col overflow-y-auto py-3"
      aria-label={`Month view, ${monthLabel}`}
      data-testid="month-calendar-grid"
    >
      <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-canvas">
        <div
          className="grid grid-cols-7 gap-1 px-2 pb-2 sm:gap-1.5 sm:px-4"
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
      </div>

      <div className="flex flex-col gap-1 px-2 pt-2 sm:gap-1.5 sm:px-4">
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
                dayData={dayDataByDate.get(cell.dateStr)!}
                events={eventsByDay.get(cell.dateStr) ?? []}
                inMonth={cell.inMonth}
                isToday={cell.dateStr === todayStr}
                onRequestCreate={onRequestCreate}
                onRequestEdit={onRequestEdit}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
