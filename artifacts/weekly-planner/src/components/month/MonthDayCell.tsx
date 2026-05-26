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
import { TaskCountBadge } from "@/components/month/TaskCountBadge";
import { useMonthView } from "@/components/month/MonthViewProvider";
import {
  MONTH_CELL_TASK_HEIGHT,
  MONTH_DAY_HEADER_HEIGHT,
} from "@/lib/month";
import { cn } from "@/lib/utils";

interface MonthDayCellProps {
  dateStr: string;
  dayData: DayData;
  events: CalendarEvent[];
  inMonth: boolean;
  isToday: boolean;
  onRequestCreate: (dateStr: string) => void;
  onRequestEdit: (eventId: string) => void;
}

const MAX_VISIBLE_PILLS = 3;

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

  const visibleEvents = useMemo(() => {
    const filtered = events.filter((e) => {
      if (importantOnly && !e.important) return false;
      if (!isCategoryVisible(e.categoryId)) return false;
      return true;
    });
    return [...filtered].sort(compareEvents);
  }, [events, importantOnly, isCategoryVisible]);

  const visible = visibleEvents.slice(0, MAX_VISIBLE_PILLS);
  const overflow = visibleEvents.slice(MAX_VISIBLE_PILLS);

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
        className="flex min-h-0 flex-col gap-1 px-1.5 pb-2"
        style={{ height: MONTH_CELL_TASK_HEIGHT }}
      >
        {visible.map((event) => (
          <EventPill
            key={event.id}
            event={event}
            timeLabel={pillTimeLabel(event, dateStr)}
            onClick={() => onRequestEdit(event.id)}
          />
        ))}
        {overflow.length > 0 ? (
          <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="type-meta self-start rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                data-testid={`month-cell-overflow-${dateStr}`}
              >
                +{overflow.length} more
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
                {visibleEvents.map((event) => (
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
    </article>
  );
}
