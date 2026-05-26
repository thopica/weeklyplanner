import { useCallback, useEffect, useRef, useState } from "react";
import type { TimeBlock } from "@/lib/types";
import {
  type DayScheduleRange,
  type ScheduleTimelineGranularity,
  SLOT_MINUTES,
  hasTimeConflict,
  maxExclusiveEndForStart,
  snapToGrid,
} from "@/lib/schedule";

export type ResizeEdge = "top" | "bottom";

interface ResizeState {
  blockId: string;
  edge: ResizeEdge;
  originClientY: number;
  origStart: number;
  origDur: number;
}

interface UseScheduleBlockResizeOptions {
  blocks: TimeBlock[];
  range: DayScheduleRange;
  granularity: ScheduleTimelineGranularity;
  onChange: (next: TimeBlock[]) => void;
}

/**
 * Drag a block's top or bottom edge in the schedule grid. Granularity-aware
 * (half-hour or hourly rows) but always snaps to `SLOT_MINUTES` (30 min) so
 * resized events line up with the existing event-time resolution.
 */
export function useScheduleBlockResize({
  blocks,
  range,
  granularity,
  onChange,
}: UseScheduleBlockResizeOptions) {
  const [resize, setResize] = useState<ResizeState | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const rangeRef = useRef(range);
  rangeRef.current = range;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pxPerMin =
    granularity === "hour" ? 48 / 60 : 32 / SLOT_MINUTES;

  const startResize = useCallback(
    (e: React.MouseEvent, block: TimeBlock, edge: ResizeEdge) => {
      e.preventDefault();
      e.stopPropagation();
      setResize({
        blockId: block.id,
        edge,
        originClientY: e.clientY,
        origStart: block.startMinute,
        origDur: block.durationMinutes,
      });
    },
    [],
  );

  useEffect(() => {
    if (!resize) return;

    const onMove = (e: MouseEvent) => {
      const bList = blocksRef.current;
      const block = bList.find((x) => x.id === resize.blockId);
      if (!block) return;

      const deltaY = e.clientY - resize.originClientY;
      const deltaMin =
        Math.round(deltaY / pxPerMin / SLOT_MINUTES) * SLOT_MINUTES;

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
        if (newDur === block.durationMinutes) return;
        onChangeRef.current(
          bList.map((x) =>
            x.id === resize.blockId
              ? { ...x, durationMinutes: newDur }
              : x,
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
        if (
          newStart === block.startMinute &&
          newDur === block.durationMinutes
        ) {
          return;
        }
        onChangeRef.current(
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
  }, [resize, pxPerMin]);

  return {
    isResizing: !!resize,
    resizingBlockId: resize?.blockId ?? null,
    startResize,
  };
}
