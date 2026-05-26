import { useCallback, useEffect, useRef, useState } from "react";
import { TimeBlock } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import {
  type DayScheduleRange,
  SLOT_MINUTES,
  PX_PER_SLOT,
  blockHeightPx,
  hasTimeConflict,
  maxExclusiveEndForStart,
  minuteToTopPx,
  snapToGrid,
} from "@/lib/schedule";
import { ScheduleTimeRail } from "@/components/schedule/ScheduleTimeRail";
import { ScheduleSlotGrid } from "@/components/schedule/ScheduleSlotGrid";

interface TimeBlockScheduleProps {
  blocks: TimeBlock[];
  /** Drag/resize emits the entire next blocks list. */
  onChange: (blocks: TimeBlock[]) => void;
  range: DayScheduleRange;
  /** Double-click on an empty slot → parent opens EventDialog in create mode. */
  onRequestCreate: (slotStart: number) => void;
  /** Click on an existing block → parent opens EventDialog in edit mode. */
  onRequestEdit: (blockId: string) => void;
}

type ResizeState = {
  blockId: string;
  edge: "top" | "bottom";
  originClientY: number;
  origStart: number;
  origDur: number;
};

interface BlockOverlayProps {
  block: TimeBlock;
  range: DayScheduleRange;
  onOpenEdit: (id: string) => void;
  onResizeStart: (e: React.MouseEvent, block: TimeBlock, edge: "top" | "bottom") => void;
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
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(e, block, "top");
        }}
        aria-hidden
      />
      <button
        type="button"
        disabled={isResizing}
        className="type-caption min-h-0 flex-1 px-2 text-left font-semibold text-foreground transition-colors hover:bg-accent disabled:pointer-events-none"
        onClick={() => onOpenEdit(block.id)}
      >
        <span className="line-clamp-2">
          {block.label.trim() ? block.label : "New block"}
        </span>
      </button>
      <div
        className="shrink-0 cursor-ns-resize bg-muted py-0.5 hover:bg-accent"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(e, block, "bottom");
        }}
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
  const [resize, setResize] = useState<ResizeState | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute);

  const applyBlocks = useCallback(
    (next: TimeBlock[]) => {
      onChange(next);
    },
    [onChange],
  );

  const handleSlotDoubleClick = (slotStart: number) => {
    const b = blocksRef.current;
    if (hasTimeConflict(slotStart, SLOT_MINUTES, b)) {
      toast({
        title: "Time not available",
        description: "That slot overlaps another block.",
        variant: "destructive",
      });
      return;
    }
    onRequestCreate(slotStart);
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    block: TimeBlock,
    edge: "top" | "bottom",
  ) => {
    setResize({
      blockId: block.id,
      edge,
      originClientY: e.clientY,
      origStart: block.startMinute,
      origDur: block.durationMinutes,
    });
  };

  useEffect(() => {
    if (!resize) return;

    const onMove = (e: MouseEvent) => {
      const bList = blocksRef.current;
      const block = bList.find((x) => x.id === resize.blockId);
      if (!block) return;

      const deltaY = e.clientY - resize.originClientY;
      const deltaMin = Math.round(deltaY / PX_PER_SLOT) * SLOT_MINUTES;

      if (resize.edge === "bottom") {
        const start = resize.origStart;
        const r = rangeRef.current;
        const maxExclusive = maxExclusiveEndForStart(
          start,
          bList,
          resize.blockId,
          r,
        );
        const maxDur = maxExclusive - start;
        const newDur = Math.min(
          Math.max(SLOT_MINUTES, snapToGrid(resize.origDur + deltaMin)),
          maxDur,
        );
        applyBlocks(
          bList.map((x) =>
            x.id === resize.blockId ? { ...x, durationMinutes: newDur } : x,
          ),
        );
      } else {
        const origEnd = resize.origStart + resize.origDur;
        const r = rangeRef.current;
        let newStart = snapToGrid(resize.origStart + deltaMin);
        newStart = Math.min(
          Math.max(r.startMin, newStart),
          origEnd - SLOT_MINUTES,
        );
        const newDur = origEnd - newStart;
        if (
          newDur < SLOT_MINUTES ||
          hasTimeConflict(newStart, newDur, bList, resize.blockId)
        ) {
          return;
        }
        applyBlocks(
          bList.map((x) =>
            x.id === resize.blockId
              ? { ...x, startMinute: newStart, durationMinutes: newDur }
              : x,
          ),
        );
      }
    };

    const onUp = () => {
      setResize(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resize, applyBlocks]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid="time-block-schedule"
    >
      <div className="planner-scroll min-h-0 flex-1 overflow-y-auto" data-planner-scroll="">
        <div className="flex px-3 py-3 sm:px-4 sm:py-4">
          <ScheduleTimeRail range={range} />
          <ScheduleSlotGrid
            range={range}
            interactive
            onSlotDoubleClick={(m) => {
              if (resize) return;
              handleSlotDoubleClick(m);
            }}
          >
            {sorted.map((block) => (
              <BlockOverlay
                key={block.id}
                block={block}
                range={range}
                onOpenEdit={onRequestEdit}
                onResizeStart={handleResizeStart}
                isResizing={!!resize}
              />
            ))}
          </ScheduleSlotGrid>
        </div>
      </div>
    </div>
  );
}
