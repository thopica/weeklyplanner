import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { getDayData } from "@/lib/storage";
import { getEvents } from "@/lib/events";
import type { CalendarEvent } from "@/lib/types";
import type { DayScheduleRange } from "@/lib/schedule";
import {
  buildAllDayLanesForWeek,
  type MultiDaySegment,
} from "@/lib/month-lanes";
import {
  formatWorkweekRange,
  getWorkweekDays,
  WEEK_RAIL_TOP_SPACER_CLASS,
  WEEK_SCHEDULE_SURFACE_CLASS,
  WORKWEEK_DAY_HEADER_HEIGHT,
  WORKWEEK_SUMMARY_HEIGHT,
  WORKWEEK_SUMMARY_HEIGHT_COMPACT,
  type WorkweekDay,
} from "@/lib/workweek";
import { ScheduleTimeRail } from "@/components/schedule/ScheduleTimeRail";
import { WorkweekDayColumn } from "@/components/workweek/WorkweekDayColumn";
import { cn } from "@/lib/utils";

interface WorkweekBoardProps {
  anchorDateStr: string;
  range: DayScheduleRange;
  eventsVersion: number;
  onOpenDay: (dateStr: string) => void;
  onRequestCreateTimed: (dateStr: string, slotStart: number) => void;
  onRequestEdit: (eventId: string) => void;
  /** Called after a successful drag/resize so the page can bump eventsVersion. */
  onEventsChanged: () => void;
}

const RAIL_TOP_SPACER_COMPACT = `calc(${WORKWEEK_DAY_HEADER_HEIGHT} + ${WORKWEEK_SUMMARY_HEIGHT_COMPACT})`;
const RAIL_TOP_SPACER_FULL = `calc(${WORKWEEK_DAY_HEADER_HEIGHT} + ${WORKWEEK_SUMMARY_HEIGHT})`;

/** Each band row (incl. gap) + a small vertical breathing room. */
const ALLDAY_ROW_REM = 1.5;
const ALLDAY_MIN_REM = 2.25;

function computeAllDayStripHeight(maxLanes: number): string {
  const rem = Math.max(ALLDAY_MIN_REM, maxLanes * ALLDAY_ROW_REM);
  return `${rem}rem`;
}

export function WorkweekBoard({
  anchorDateStr,
  range,
  eventsVersion,
  onOpenDay,
  onRequestCreateTimed,
  onRequestEdit,
  onEventsChanged,
}: WorkweekBoardProps) {
  const days: WorkweekDay[] = getWorkweekDays(anchorDateStr);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const rangeLabel = formatWorkweekRange(days);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });

  const allEvents = useMemo(() => {
    void eventsVersion;
    return getEvents();
  }, [eventsVersion]);

  const eventsById = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const e of allEvents) map.set(e.id, e);
    return map;
  }, [allEvents]);

  const weekDates = useMemo(() => days.map((d) => d.dateStr), [days]);

  const allDayLanes = useMemo(
    () => buildAllDayLanesForWeek(allEvents, weekDates),
    [allEvents, weekDates],
  );

  const allDayStripHeight = computeAllDayStripHeight(allDayLanes.maxLanes);

  const allDayBandsByDate = useMemo(() => {
    const map = new Map<string, (MultiDaySegment | null)[]>();
    for (const dateStr of weekDates) {
      const cellSegs = allDayLanes.cells.get(dateStr) ?? [];
      const bands: (MultiDaySegment | null)[] = new Array(
        allDayLanes.maxLanes,
      ).fill(null);
      for (const seg of cellSegs) bands[seg.lane] = seg;
      map.set(dateStr, bands);
    }
    return map;
  }, [weekDates, allDayLanes]);

  const updateScrollEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth > 1;
    setScrollEdges({
      left: overflow && el.scrollLeft > 0,
      right: overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollEdges();
    el.addEventListener("scroll", updateScrollEdges, { passive: true });
    const ro = new ResizeObserver(updateScrollEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollEdges);
      ro.disconnect();
    };
  }, [updateScrollEdges, anchorDateStr]);

  return (
    <section
      className="scrollbar-hide flex min-h-0 w-full flex-1 flex-col overflow-hidden px-3 py-3 2xl:px-5"
      aria-label={`Week view, ${rangeLabel}`}
      data-testid="workweek-board"
    >
      <div className="relative min-h-0 w-full flex-1">
        <div
          ref={scrollRef}
          className="planner-scroll flex h-full min-h-0 w-full overflow-x-auto overflow-y-auto"
        >
          <div className="scrollbar-hide flex w-full min-w-0 flex-1 items-start gap-2 pb-3 2xl:gap-3">
            <div
              className={cn(
                "sticky left-0 z-10 flex shrink-0 flex-col",
                WEEK_RAIL_TOP_SPACER_CLASS,
              )}
            >
              <div
                className="shrink-0 2xl:hidden"
                style={{ height: RAIL_TOP_SPACER_COMPACT }}
                aria-hidden
              />
              <div
                className="hidden shrink-0 2xl:block"
                style={{ height: RAIL_TOP_SPACER_FULL }}
                aria-hidden
              />
              <div
                className="type-meta flex shrink-0 items-start justify-end border-b border-border pr-2 pt-1 font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ height: allDayStripHeight }}
                aria-hidden
              >
                All day
              </div>
              <div
                className={cn(
                  "shrink-0 overflow-hidden rounded-xl border border-border",
                  WEEK_SCHEDULE_SURFACE_CLASS,
                )}
              >
                <ScheduleTimeRail
                  range={range}
                  granularity="halfHour"
                  compact
                  className="border-r-0"
                />
              </div>
            </div>

            {days.map(({ dateStr }) => (
              <WorkweekDayColumn
                key={dateStr}
                dateStr={dateStr}
                dayData={getDayData(dateStr)}
                range={range}
                isToday={dateStr === todayStr}
                eventsVersion={eventsVersion}
                allDayBands={allDayBandsByDate.get(dateStr) ?? []}
                eventsById={eventsById}
                allDayStripHeight={allDayStripHeight}
                onOpenDay={onOpenDay}
                onRequestCreateTimed={onRequestCreateTimed}
                onRequestEdit={onRequestEdit}
                onEventsChanged={onEventsChanged}
              />
            ))}
          </div>
        </div>

        {scrollEdges.left ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-linear-to-r from-canvas to-transparent dark:from-background"
          />
        ) : null}
        {scrollEdges.right ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-linear-to-l from-canvas to-transparent dark:from-background"
          />
        ) : null}
      </div>
    </section>
  );
}
