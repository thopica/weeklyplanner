import type { MouseEvent as ReactMouseEvent } from "react";
import type { CalendarEvent } from "@/lib/types";
import { getCategoryOrFallback } from "@/lib/categories";
import { paletteFor } from "@/lib/palette";
import { cn } from "@/lib/utils";

interface EventPillProps {
  event: CalendarEvent;
  /**
   * "HH:mm" prefix to render before the title. Only set when the event starts
   * on this cell's day and isn't all-day; multi-day continuations and all-day
   * events render title-only.
   */
  timeLabel?: string;
  /**
   * Optional click handler. When provided, the pill renders as a focusable
   * <button> so it can open the edit dialog. The cell-level click handler
   * should still stopPropagation to keep create-mode out of the way.
   */
  onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
}

export function EventPill({ event, timeLabel, onClick }: EventPillProps) {
  const category = getCategoryOrFallback(event.categoryId);
  const palette = paletteFor(category.colorKey);
  const title = event.title.trim() || "Untitled";
  const tooltip = [timeLabel, title, event.important ? "important" : null]
    .filter(Boolean)
    .join(" \u00b7 ");

  const baseClass = cn(
    "type-caption flex w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-left",
    event.important ? "font-semibold" : "font-medium",
  );

  const inner = (
    <>
      {timeLabel ? (
        <span className="tabular-nums opacity-80">{timeLabel}</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{title}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        title={tooltip}
        aria-label={tooltip || title}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        style={{ backgroundColor: palette.bg, color: palette.text }}
        className={cn(
          baseClass,
          "cursor-pointer transition-shadow hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        )}
        data-testid={`event-pill-${event.id}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      role="listitem"
      title={tooltip}
      style={{ backgroundColor: palette.bg, color: palette.text }}
      className={baseClass}
    >
      {inner}
    </div>
  );
}
