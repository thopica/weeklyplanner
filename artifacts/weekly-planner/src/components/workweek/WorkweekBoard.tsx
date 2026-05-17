import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { getDayData } from "@/lib/storage";
import type { DayScheduleRange } from "@/lib/schedule";
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
  onOpenDay: (dateStr: string) => void;
}

const RAIL_TOP_SPACER_COMPACT = `calc(${WORKWEEK_DAY_HEADER_HEIGHT} + ${WORKWEEK_SUMMARY_HEIGHT_COMPACT})`;
const RAIL_TOP_SPACER_FULL = `calc(${WORKWEEK_DAY_HEADER_HEIGHT} + ${WORKWEEK_SUMMARY_HEIGHT})`;

export function WorkweekBoard({ anchorDateStr, range, onOpenDay }: WorkweekBoardProps) {
  const days: WorkweekDay[] = getWorkweekDays(anchorDateStr);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const rangeLabel = formatWorkweekRange(days);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });

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
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-3 py-3 2xl:px-5"
      aria-label={`Week view, ${rangeLabel}`}
      data-testid="workweek-board"
    >
      <div className="relative min-h-0 w-full flex-1">
        <div
          ref={scrollRef}
          className="flex h-full min-h-0 w-full overflow-x-auto overflow-y-auto"
        >
          <div className="flex w-full min-w-0 flex-1 items-start gap-2 pb-3 2xl:gap-3">
            <div className="sticky left-0 z-10 flex shrink-0 flex-col">
              <div
                className={cn(
                  "shrink-0 2xl:hidden",
                  WEEK_RAIL_TOP_SPACER_CLASS,
                )}
                style={{ height: RAIL_TOP_SPACER_COMPACT }}
                aria-hidden
              />
              <div
                className={cn(
                  "hidden shrink-0 2xl:block",
                  WEEK_RAIL_TOP_SPACER_CLASS,
                )}
                style={{ height: RAIL_TOP_SPACER_FULL }}
                aria-hidden
              />
              <div
                className={cn(
                  "shrink-0 overflow-hidden rounded-xl border border-border",
                  WEEK_SCHEDULE_SURFACE_CLASS,
                )}
              >
                <ScheduleTimeRail
                  range={range}
                  granularity="hour"
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
                onOpenDay={onOpenDay}
              />
            ))}
          </div>
        </div>

        {scrollEdges.left ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-linear-to-r from-background to-transparent"
          />
        ) : null}
        {scrollEdges.right ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-linear-to-l from-background to-transparent"
          />
        ) : null}
      </div>
    </section>
  );
}
