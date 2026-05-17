import type { ReactNode } from "react";
import {
  type DayScheduleRange,
  type ScheduleTimelineGranularity,
} from "@/lib/schedule";
import { useScheduleTimeline } from "@/components/schedule/schedule-timeline";
import { cn } from "@/lib/utils";

interface ScheduleSlotGridProps {
  range: DayScheduleRange;
  children?: ReactNode;
  onSlotDoubleClick?: (slotStartMinute: number) => void;
  className?: string;
  interactive?: boolean;
  granularity?: ScheduleTimelineGranularity;
}

export function ScheduleSlotGrid({
  range,
  children,
  onSlotDoubleClick,
  className,
  interactive = false,
  granularity = "halfHour",
}: ScheduleSlotGridProps) {
  const timeline = useScheduleTimeline(range, granularity);

  return (
    <div
      className={cn("relative min-w-0 flex-1", className)}
      style={{ height: timeline.gridHeightPx }}
    >
      {timeline.ticks.map((m, index) => (
        <div
          key={m}
          className={cn(
            "absolute left-0 right-0",
            index < timeline.ticks.length - 1 && "border-b border-border",
            interactive &&
              "transition-colors motion-reduce:transition-none hover:bg-surface-subtle",
          )}
          style={{
            top: timeline.minuteToTop(m),
            height: timeline.rowHeightPx,
          }}
          onDoubleClick={
            onSlotDoubleClick
              ? (e) => {
                  e.preventDefault();
                  onSlotDoubleClick(m);
                }
              : undefined
          }
        />
      ))}
      {children}
    </div>
  );
}
