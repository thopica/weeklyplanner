import { formatScheduleTime, type DayScheduleRange, type ScheduleTimelineGranularity } from "@/lib/schedule";
import { useScheduleTimeline } from "@/components/schedule/schedule-timeline";
import { cn } from "@/lib/utils";

interface ScheduleTimeRailProps {
  range: DayScheduleRange;
  className?: string;
  compact?: boolean;
  granularity?: ScheduleTimelineGranularity;
}

export function ScheduleTimeRail({
  range,
  className,
  compact,
  granularity = "halfHour",
}: ScheduleTimeRailProps) {
  const timeline = useScheduleTimeline(range, granularity);

  return (
    <div
      className={cn(
        "relative shrink-0 border-r-2 border-border bg-surface-subtle",
        compact ? "w-14" : "w-[4.75rem] sm:w-20",
        className,
      )}
      style={{ height: timeline.gridHeightPx }}
      aria-hidden
    >
      {timeline.ticks.map((m) => (
        <div
          key={m}
          className="pointer-events-none absolute right-0 left-0 flex justify-end pr-1.5 sm:pr-2"
          style={{
            top: timeline.minuteToTop(m),
            transform: "translateY(-50%)",
          }}
        >
          <span className="type-caption block whitespace-nowrap font-semibold leading-none text-foreground">
            {formatScheduleTime(m)}
          </span>
        </div>
      ))}
    </div>
  );
}
