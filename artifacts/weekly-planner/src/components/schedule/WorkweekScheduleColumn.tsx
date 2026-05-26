import type { TimeBlock } from "@/lib/types";
import type { DayScheduleRange } from "@/lib/schedule";
import { ScheduleSlotGrid } from "@/components/schedule/ScheduleSlotGrid";
import { ScheduleBlockChip } from "@/components/schedule/ScheduleBlockChip";
import { useScheduleBlockResize } from "@/components/schedule/useScheduleBlockResize";

interface WorkweekScheduleColumnProps {
  blocks: TimeBlock[];
  range: DayScheduleRange;
  /** Single-click on an empty hour slot → parent opens EventDialog in create mode. */
  onRequestCreate?: (slotStart: number) => void;
  /** Click on an existing chip → parent opens EventDialog in edit mode. */
  onRequestEdit?: (blockId: string) => void;
  /**
   * Drag-resize emits the next blocks list for this day; parent should sync
   * to the events store (e.g. via `syncBlocksToEventsForDay`).
   */
  onBlocksChange?: (next: TimeBlock[]) => void;
}

export function WorkweekScheduleColumn({
  blocks,
  range,
  onRequestCreate,
  onRequestEdit,
  onBlocksChange,
}: WorkweekScheduleColumnProps) {
  const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute);
  const { isResizing, resizingBlockId, startResize } = useScheduleBlockResize({
    blocks,
    range,
    granularity: "hour",
    onChange: (next) => onBlocksChange?.(next),
  });

  return (
    <ScheduleSlotGrid
      range={range}
      granularity="hour"
      className="bg-transparent"
      interactive={!!onRequestCreate}
      onSlotClick={
        onRequestCreate
          ? (m) => {
              if (isResizing) return;
              onRequestCreate(m);
            }
          : undefined
      }
    >
      {sorted.map((block) => (
        <ScheduleBlockChip
          key={block.id}
          block={block}
          range={range}
          granularity="hour"
          compact
          onClick={onRequestEdit}
          onResizeStart={onBlocksChange ? startResize : undefined}
          isResizing={resizingBlockId === block.id}
        />
      ))}
    </ScheduleSlotGrid>
  );
}
