import type { MouseEvent as ReactMouseEvent } from "react";
import type { CalendarEvent } from "@/lib/types";
import { getCategoryOrFallback } from "@/lib/categories";
import { paletteFor } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { MultiDaySegment } from "@/lib/month-lanes";

interface WorkweekAllDayBandProps {
  segment: MultiDaySegment | null;
  event: CalendarEvent | undefined;
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
}

/**
 * Single lane row for one day in the week view's all-day strip. Renders a
 * spacer when `segment` is null so adjacent days stay vertically aligned by
 * lane index.
 */
export function WorkweekAllDayBand({
  segment,
  event,
  onClick,
}: WorkweekAllDayBandProps) {
  if (!segment || !event) {
    return (
      <div
        aria-hidden="true"
        className="h-5 w-full shrink-0"
        data-testid="workweek-allday-band-spacer"
      />
    );
  }

  const category = getCategoryOrFallback(event.categoryId);
  const palette = paletteFor(category.colorKey);
  const title = event.title.trim() || "Untitled";
  const tooltip = [title, category.label, event.important ? "important" : null]
    .filter(Boolean)
    .join(" \u00b7 ");

  const isSingleCellSegment = segment.isLeftEdge && segment.isRightEdge;
  const radiusClass = isSingleCellSegment
    ? "rounded-md"
    : segment.isLeftEdge
      ? "rounded-l-md"
      : segment.isRightEdge
        ? "rounded-r-md"
        : "rounded-none";
  const showTitle = segment.isLeftEdge;

  return (
    <button
      type="button"
      title={tooltip}
      aria-label={tooltip || title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      style={{ backgroundColor: palette.bg, color: palette.text }}
      className={cn(
        "type-caption flex h-5 w-full shrink-0 items-center text-left",
        radiusClass,
        showTitle ? "px-1.5" : "px-0",
        event.important ? "font-semibold" : "font-medium",
        "cursor-pointer transition-shadow hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      )}
      data-testid={`workweek-allday-band-${segment.eventId}`}
      data-left-edge={segment.isLeftEdge ? "true" : "false"}
      data-right-edge={segment.isRightEdge ? "true" : "false"}
    >
      {showTitle ? (
        <span className="min-w-0 flex-1 truncate">{title}</span>
      ) : null}
    </button>
  );
}
