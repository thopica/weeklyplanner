import type { TimeBlock } from "@/lib/types";
import {
  type DayScheduleRange,
  formatBlockRange,
  type ScheduleTimelineGranularity,
} from "@/lib/schedule";
import { useScheduleTimeline } from "@/components/schedule/schedule-timeline";
import { cn } from "@/lib/utils";

interface ScheduleBlockChipProps {
  block: TimeBlock;
  range: DayScheduleRange;
  compact?: boolean;
  granularity?: ScheduleTimelineGranularity;
}

export function ScheduleBlockChip({
  block,
  range,
  compact,
  granularity = "halfHour",
}: ScheduleBlockChipProps) {
  const timeline = useScheduleTimeline(range, granularity);
  const top = timeline.minuteToTop(block.startMinute);
  const h = Math.max(timeline.blockHeight(block.durationMinutes), compact ? 20 : 24);
  const label = block.label.trim() || "Untitled";

  return (
    <div
      className={cn(
        "absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border border-primary/80 bg-surface-accent px-1.5 shadow-sm ring-1 ring-border",
        compact ? "py-0.5" : "py-1",
      )}
      style={{ top, height: h }}
      title={formatBlockRange(block)}
      data-testid={`schedule-chip-${block.startMinute}`}
    >
      <p
        className={cn(
          "font-semibold leading-tight text-foreground",
          compact ? "type-caption line-clamp-1 text-[0.65rem]" : "type-caption line-clamp-2",
        )}
      >
        {label}
      </p>
      {!compact && h >= 40 ? (
        <p className="type-caption mt-0.5 truncate text-foreground-subtle">
          {formatBlockRange(block)}
        </p>
      ) : null}
    </div>
  );
}
