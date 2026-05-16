import type { TimeBlock } from "@/lib/types";
import type { DayScheduleRange } from "@/lib/schedule";
import { ScheduleSlotGrid } from "@/components/schedule/ScheduleSlotGrid";
import { ScheduleBlockChip } from "@/components/schedule/ScheduleBlockChip";

interface WorkweekScheduleColumnProps {
  blocks: TimeBlock[];
  range: DayScheduleRange;
}

export function WorkweekScheduleColumn({ blocks, range }: WorkweekScheduleColumnProps) {
  const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute);

  return (
    <ScheduleSlotGrid
      range={range}
      granularity="hour"
      className="bg-transparent"
    >
      {sorted.map((block) => (
        <ScheduleBlockChip
          key={block.id}
          block={block}
          range={range}
          granularity="hour"
          compact
        />
      ))}
    </ScheduleSlotGrid>
  );
}
