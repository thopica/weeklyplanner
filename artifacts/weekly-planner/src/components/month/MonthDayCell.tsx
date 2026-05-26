import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { format, parseISO } from "date-fns";
import type { CalendarEvent, DayData } from "@/lib/types";
import { isMeaningfulTask, mergeDayTasks } from "@/lib/tasks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EventPill } from "@/components/month/EventPill";
import { MultiDayBand } from "@/components/month/MultiDayBand";
import { TaskCountBadge } from "@/components/month/TaskCountBadge";
import { useMonthView } from "@/components/month/MonthViewProvider";
import type { MultiDaySegment } from "@/lib/month-lanes";
import {
  MONTH_CELL_TASK_HEIGHT,
  MONTH_DAY_HEADER_HEIGHT,
} from "@/lib/month";
import { cn } from "@/lib/utils";

interface MonthDayCellProps {
  dateStr: string;
  dayData: DayData;
  events: CalendarEvent[];
  /**
   * Per-lane band data for this cell. Length matches the row's max lane count.
   * Entries are null where this cell has no event in that lane (renders an
   * invisible spacer so lane vertical alignment stays consistent across cells).
   */
  multiDayBands: (MultiDaySegment | null)[];
  inMonth: boolean;
  isToday: boolean;
  onRequestCreate: (dateStr: string) => void;
  onRequestEdit: (eventId: string) => void;
}

const MAX_VISIBLE_ROWS = 3;

function pillTimeLabel(
  event: CalendarEvent,
  dateStr: string,
): string | undefined {
  if (event.allDay) return undefined;
  if (event.startsAt.slice(0, 10) !== dateStr) return undefined;
  return event.startsAt.slice(11, 16);
}

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.important !== b.important) return a.important ? -1 : 1;
  if (a.startsAt < b.startsAt) return -1;
  if (a.startsAt > b.startsAt) return 1;
  return 0;
}

export function MonthDayCell({
  dateStr,
  dayData,
  events,
  multiDayBands,
  inMonth,
  isToday,
  onRequestCreate,
  onRequestEdit,
}: MonthDayCellProps) {
  const date = parseISO(`${dateStr}T12:00:00`);
  const { importantOnly, isCategoryVisible } = useMonthView();
  const [overflowOpen, setOverflowOpen] = useState(false);

  const taskCount = useMemo(
    () => mergeDayTasks(dayData).filter(isMeaningfulTask).length,
    [dayData],
  );

  const eventsById = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const e of events) map.set(e.id, e);
    return map;
  }, [events]);

  /**
   * Bands filtered by month-view filters. Lane indices are preserved by
   * blanking filtered-out segments (null) — alignment across cells in the
   * same row must stay stable even when individual cells hide a band.
   */
  const visibleBands = useMemo(() => {
    return multiDayBands.map((seg) => {
      if (!seg) return null;
      const ev = eventsById.get(seg.eventId);
      if (!ev) return null;
      if (importantOnly && !ev.important) return null;
      if (!isCategoryVisible(ev.categoryId)) return null;
      return seg;
    });
  }, [multiDayBands, eventsById, importantOnly, isCategoryVisible]);

  /** Single-day events only — multi-day are rendered as bands above. */
  const singleDayEvents = useMemo(() => {
    const multiDayIds = new Set(
      multiDayBands.filter((b): b is MultiDaySegment => b !== null).map((b) => b.eventId),
    );
    const filtered = events.filter((e) => {
      if (multiDayIds.has(e.id)) return false;
      if (importantOnly && !e.important) return false;
      if (!isCategoryVisible(e.categoryId)) return false;
      return true;
    });
    return [...filtered].sort(compareEvents);
  }, [events, multiDayBands, importantOnly, isCategoryVisible]);

  /**
   * Reserve display rows for bands first, then fill the remainder with
   * single-day pills. Total visible rows is capped so cell height stays even.
   */
  const bandRowCount = visibleBands.length;
  const remainingRows = Math.max(0, MAX_VISIBLE_ROWS - bandRowCount);
  const visibleSingleDay = singleDayEvents.slice(0, remainingRows);
  const overflowSingleDay = singleDayEvents.slice(remainingRows);

  /** Overflow popover lists every event for this day (bands + single-day). */
  const allDayEvents = useMemo(() => {
    return [...events]
      .filter((e) => {
        if (importantOnly && !e.important) return false;
        if (!isCategoryVisible(e.categoryId)) return false;
        return true;
      })
      .sort(compareEvents);
  }, [events, importantOnly, isCategoryVisible]);

  const handleCellActivate = () => {
    onRequestCreate(dateStr);
  };

  const handleCellKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    handleCellActivate();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCellActivate}
      onKeyDown={handleCellKeyDown}
      className={cn(
        "flex min-w-0 flex-1 cursor-pointer flex-col overflow-hidden rounded-xl border border-border outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "hover:border-primary/40",
        inMonth ? "planner-card-surface" : "bg-surface-subtle/50",
      )}
      aria-labelledby={`month-day-${dateStr}`}
      aria-label={`Create event on ${format(date, "EEEE, MMMM d")}`}
      data-testid={`month-cell-${dateStr}`}
    >
      <div
        style={{ height: MONTH_DAY_HEADER_HEIGHT }}
        className="flex shrink-0 items-start justify-between gap-1 px-2 py-2 sm:px-3"
      >
        {isToday ? (
          <div className="flex shrink-0 flex-col items-start gap-0.5 rounded-md bg-surface-accent px-1.5 py-1">
            <span
              id={`month-day-${dateStr}`}
              className="text-lead font-semibold tabular-nums leading-none tracking-tight text-primary"
            >
              {format(date, "d")}
            </span>
            <span className="type-label font-semibold uppercase tracking-wider text-primary">
              Today
            </span>
          </div>
        ) : (
          <span
            id={`month-day-${dateStr}`}
            className={cn(
              "text-lead font-semibold tabular-nums tracking-tight",
              inMonth ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {format(date, "d")}
          </span>
        )}
        <TaskCountBadge count={taskCount} dimmed={!inMonth} />
      </div>

      <div
        className="flex min-h-0 flex-col pb-2"
        style={{ height: MONTH_CELL_TASK_HEIGHT }}
      >
        {bandRowCount > 0 ? (
          <div className="flex shrink-0 flex-col gap-0.5">
            {visibleBands.map((seg, laneIdx) => (
              <MultiDayBand
                key={`lane-${laneIdx}`}
                segment={seg}
                event={seg ? eventsById.get(seg.eventId) : undefined}
                onClick={() => seg && onRequestEdit(seg.eventId)}
              />
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "flex min-h-0 flex-col gap-1 px-1.5",
            bandRowCount > 0 ? "pt-1" : "",
          )}
        >
          {visibleSingleDay.map((event) => (
            <EventPill
              key={event.id}
              event={event}
              timeLabel={pillTimeLabel(event, dateStr)}
              onClick={() => onRequestEdit(event.id)}
            />
          ))}
          {overflowSingleDay.length > 0 ? (
            <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="type-meta self-start rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  data-testid={`month-cell-overflow-${dateStr}`}
                >
                  +{overflowSingleDay.length} more
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-64 p-2"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="type-label mb-1.5 text-muted-foreground">
                  {format(date, "EEE, MMM d")}
                </div>
                <ul className="flex flex-col gap-1">
                  {allDayEvents.map((event) => (
                    <li key={event.id}>
                      <EventPill
                        event={event}
                        timeLabel={pillTimeLabel(event, dateStr)}
                        onClick={() => {
                          setOverflowOpen(false);
                          onRequestEdit(event.id);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      </div>
    </article>
  );
}
