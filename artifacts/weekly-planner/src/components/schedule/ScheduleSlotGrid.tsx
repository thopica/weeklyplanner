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
  /**
   * Fires when an empty slot is clicked. Provides the slot's start minute.
   * Chips render as siblings (absolutely positioned) so their clicks don't
   * reach the slot rows.
   */
  onSlotClick?: (slotStartMinute: number) => void;
  className?: string;
  interactive?: boolean;
  granularity?: ScheduleTimelineGranularity;
}

export function ScheduleSlotGrid({
  range,
  children,
  onSlotClick,
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
              "cursor-pointer transition-colors motion-reduce:transition-none hover:bg-surface-subtle",
          )}
          style={{
            top: timeline.minuteToTop(m),
            height: timeline.rowHeightPx,
          }}
          onClick={
            onSlotClick
              ? (e) => {
                  e.preventDefault();
                  onSlotClick(m);
                }
              : undefined
          }
        />
      ))}
      {children}
    </div>
  );
}
