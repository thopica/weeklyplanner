import { useCallback } from "react";
import { TimeBlock } from "@/lib/types";
import {
  type DayScheduleRange,
  blockHeightPx,
  minuteToTopPx,
} from "@/lib/schedule";
import { ScheduleTimeRail } from "@/components/schedule/ScheduleTimeRail";
import { ScheduleSlotGrid } from "@/components/schedule/ScheduleSlotGrid";
import { useScheduleBlockResize } from "@/components/schedule/useScheduleBlockResize";
import { cn } from "@/lib/utils";

interface TimeBlockScheduleProps {
  blocks: TimeBlock[];
  /** Drag/resize emits the entire next blocks list. */
  onChange: (blocks: TimeBlock[]) => void;
  range: DayScheduleRange;
  /** Single-click on an empty slot → parent opens EventDialog in create mode. */
  onRequestCreate: (slotStart: number) => void;
  /** Click on an existing block → parent opens EventDialog in edit mode. */
  onRequestEdit: (blockId: string) => void;
}

interface BlockOverlayProps {
  block: TimeBlock;
  range: DayScheduleRange;
  onOpenEdit: (id: string) => void;
  onResizeStart: (
    e: React.MouseEvent,
    block: TimeBlock,
    edge: "top" | "bottom",
  ) => void;
  isResizing: boolean;
}

function BlockOverlay({
  block,
  range,
  onOpenEdit,
  onResizeStart,
  isResizing,
}: BlockOverlayProps) {
  const top = minuteToTopPx(block.startMinute, range);
  const h = Math.max(blockHeightPx(block.durationMinutes), 24);

  return (
    <div
      className="absolute left-0 right-0 z-10 flex flex-col overflow-hidden rounded-md border border-primary bg-surface-accent shadow-sm ring-1 ring-border"
      style={{ top, height: h }}
      data-testid={`time-block-${block.startMinute}`}
    >
      <div
        className="shrink-0 cursor-ns-resize bg-muted py-0.5 hover:bg-accent"
        onMouseDown={(e) => onResizeStart(e, block, "top")}
        aria-hidden
      />
      <button
        type="button"
        disabled={isResizing}
        className="type-caption min-h-0 flex-1 px-2 text-left font-semibold text-foreground transition-colors hover:bg-accent disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={(e) => {
          e.stopPropagation();
          onOpenEdit(block.id);
        }}
      >
        <span className="line-clamp-2">
          {block.label.trim() ? block.label : "New block"}
        </span>
      </button>
      <div
        className="shrink-0 cursor-ns-resize bg-muted py-0.5 hover:bg-accent"
        onMouseDown={(e) => onResizeStart(e, block, "bottom")}
        aria-hidden
      />
    </div>
  );
}

export function TimeBlockSchedule({
  blocks,
  onChange,
  range,
  onRequestCreate,
  onRequestEdit,
}: TimeBlockScheduleProps) {
  const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute);

  const applyBlocks = useCallback(
    (next: TimeBlock[]) => {
      onChange(next);
    },
    [onChange],
  );

  const { isResizing, resizingBlockId, startResize } = useScheduleBlockResize({
    blocks,
    range,
    granularity: "halfHour",
    onChange: applyBlocks,
  });

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col")}
      data-testid="time-block-schedule"
    >
      <div className="planner-scroll min-h-0 flex-1 overflow-y-auto" data-planner-scroll="">
        <div className="flex px-3 py-3 sm:px-4 sm:py-4">
          <ScheduleTimeRail range={range} />
          <ScheduleSlotGrid
            range={range}
            interactive
            onSlotClick={(m) => {
              if (isResizing) return;
              onRequestCreate(m);
            }}
          >
            {sorted.map((block) => (
              <BlockOverlay
                key={block.id}
                block={block}
                range={range}
                onOpenEdit={onRequestEdit}
                onResizeStart={startResize}
                isResizing={resizingBlockId === block.id}
              />
            ))}
          </ScheduleSlotGrid>
        </div>
      </div>
    </div>
  );
}
