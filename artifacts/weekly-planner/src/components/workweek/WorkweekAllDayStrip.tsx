import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "@/lib/types";
import type { MultiDaySegment } from "@/lib/month-lanes";
import { WorkweekAllDayBand } from "@/components/workweek/WorkweekAllDayBand";
import { WEEK_SUMMARY_SURFACE_CLASS } from "@/lib/workweek";
import { cn } from "@/lib/utils";

interface WorkweekAllDayStripProps {
  dateStr: string;
  /**
   * Lane-aligned band data for this day. Array length equals the week's max
   * lane count; null entries render invisible spacers so the same event sits
   * at the same vertical position across the row.
   */
  bands: (MultiDaySegment | null)[];
  /** Event lookup so each band can read its title/category/important state. */
  eventsById: Map<string, CalendarEvent>;
  /** Strip height in CSS units — driven by the week's max lane count. */
  height: string;
  onRequestEdit: (eventId: string) => void;
}

/**
 * Display-only strip. Bands are clickable to edit. There is no
 * click-to-create affordance here — users create events (timed or all-day)
 * via the schedule grid below, and toggle "All day" in the dialog.
 */
export function WorkweekAllDayStrip({
  dateStr,
  bands,
  eventsById,
  height,
  onRequestEdit,
}: WorkweekAllDayStripProps) {
  const date = useMemo(() => parseISO(`${dateStr}T12:00:00`), [dateStr]);
  const hasAnyEvent = bands.some((b) => b !== null);

  return (
    <div
      style={{ height }}
      className={cn(
        "flex shrink-0 flex-col justify-center gap-0.5 border-b border-border px-1",
        WEEK_SUMMARY_SURFACE_CLASS,
      )}
      aria-label={`All-day events for ${format(date, "EEEE, MMMM d")}`}
      data-testid={`workweek-allday-${dateStr}`}
    >
      {hasAnyEvent
        ? bands.map((seg, laneIdx) => (
            <WorkweekAllDayBand
              key={`lane-${laneIdx}`}
              segment={seg}
              event={seg ? eventsById.get(seg.eventId) : undefined}
              onClick={() => seg && onRequestEdit(seg.eventId)}
            />
          ))
        : null}
    </div>
  );
}
