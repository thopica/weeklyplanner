import type { MouseEvent as ReactMouseEvent } from "react";
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
  /** Click on chip body → parent opens edit dialog. */
  onClick?: (blockId: string) => void;
  /**
   * Optional drag-resize handlers. When provided, top and bottom resize
   * handles render on the chip. The parent owns the resize state machine.
   */
  onResizeStart?: (
    e: ReactMouseEvent,
    block: TimeBlock,
    edge: "top" | "bottom",
  ) => void;
  /** When true, this chip is the actively resizing one — disable click. */
  isResizing?: boolean;
}

export function ScheduleBlockChip({
  block,
  range,
  compact,
  granularity = "halfHour",
  onClick,
  onResizeStart,
  isResizing,
}: ScheduleBlockChipProps) {
  const timeline = useScheduleTimeline(range, granularity);
  const top = timeline.minuteToTop(block.startMinute);
  const h = Math.max(timeline.blockHeight(block.durationMinutes), compact ? 20 : 24);
  const label = block.label.trim() || "Untitled";
  const resizable = !!onResizeStart;

  const baseClass = cn(
    "absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border border-primary/80 bg-surface-accent text-left shadow-sm ring-1 ring-border",
  );

  const body = (
    <>
      {onClick ? (
        <button
          type="button"
          disabled={isResizing}
          onClick={(e) => {
            e.stopPropagation();
            onClick(block.id);
          }}
          title={formatBlockRange(block)}
          className={cn(
            "absolute inset-0 flex min-h-0 flex-col justify-center px-1.5 text-left text-foreground transition-colors hover:bg-accent disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            compact ? "py-0.5" : "py-1",
          )}
          data-testid={`schedule-chip-${block.startMinute}`}
        >
          <span
            className={cn(
              "block font-semibold leading-tight",
              compact ? "type-caption line-clamp-1 text-[0.65rem]" : "type-caption line-clamp-2",
            )}
          >
            {label}
          </span>
          {!compact && h >= 40 ? (
            <span className="type-caption mt-0.5 block truncate text-foreground-subtle">
              {formatBlockRange(block)}
            </span>
          ) : null}
        </button>
      ) : (
        <div
          className={cn(
            "absolute inset-0 flex min-h-0 flex-col justify-center px-1.5",
            compact ? "py-0.5" : "py-1",
          )}
          title={formatBlockRange(block)}
        >
          <span
            className={cn(
              "block font-semibold leading-tight text-foreground",
              compact ? "type-caption line-clamp-1 text-[0.65rem]" : "type-caption line-clamp-2",
            )}
          >
            {label}
          </span>
          {!compact && h >= 40 ? (
            <span className="type-caption mt-0.5 block truncate text-foreground-subtle">
              {formatBlockRange(block)}
            </span>
          ) : null}
        </div>
      )}
      {resizable ? (
        <>
          <div
            className="absolute inset-x-0 top-0 z-20 h-1 cursor-ns-resize bg-transparent transition-colors hover:bg-accent"
            onMouseDown={(e) => onResizeStart(e, block, "top")}
            aria-hidden
          />
          <div
            className="absolute inset-x-0 bottom-0 z-20 h-1 cursor-ns-resize bg-transparent transition-colors hover:bg-accent"
            onMouseDown={(e) => onResizeStart(e, block, "bottom")}
            aria-hidden
          />
        </>
      ) : null}
    </>
  );

  return (
    <div
      className={baseClass}
      style={{ top, height: h }}
      data-testid={`schedule-chip-wrapper-${block.startMinute}`}
    >
      {body}
    </div>
  );
}
