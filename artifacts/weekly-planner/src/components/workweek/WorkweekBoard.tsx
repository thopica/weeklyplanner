import { format } from "date-fns";
import { getDayData } from "@/lib/storage";
import type { DayScheduleRange } from "@/lib/schedule";
import {
  formatWorkweekRange,
  getWorkweekDays,
  WORKWEEK_DAY_HEADER_HEIGHT,
  WORKWEEK_SUMMARY_HEIGHT,
  WEEK_RAIL_TOP_SPACER_CLASS,
  WEEK_SCHEDULE_SURFACE_CLASS,
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

const RAIL_TOP_SPACER = `calc(${WORKWEEK_DAY_HEADER_HEIGHT} + ${WORKWEEK_SUMMARY_HEIGHT})`;

export function WorkweekBoard({ anchorDateStr, range, onOpenDay }: WorkweekBoardProps) {
  const days: WorkweekDay[] = getWorkweekDays(anchorDateStr);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const rangeLabel = formatWorkweekRange(days);

  return (
    <section
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 py-3 sm:px-5"
      aria-label={`Week view, ${rangeLabel}`}
      data-testid="workweek-board"
    >
      <div className="scrollbar-hide flex min-h-0 w-full flex-1 overflow-x-auto overflow-y-auto">
        <div className="flex min-h-full w-full min-w-max gap-3 pb-1">
          <div className="sticky left-0 z-10 flex shrink-0 flex-col self-stretch">
            <div
              className={cn("shrink-0", WEEK_RAIL_TOP_SPACER_CLASS)}
              style={{ height: RAIL_TOP_SPACER }}
              aria-hidden
            />
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border",
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
    </section>
  );
}
