import { useMemo } from "react";
import { Plus } from "lucide-react";
import { getAllDayEventsForDay } from "@/lib/event-projection";
import { getCategoryOrFallback } from "@/lib/categories";
import { paletteFor } from "@/lib/palette";
import { cn } from "@/lib/utils";

interface AllDayBannerProps {
  dateStr: string;
  /** Bumped by the page when events change so the pill list re-reads. */
  eventsVersion: number;
  onRequestCreate: (dateStr: string) => void;
  onRequestEdit: (eventId: string) => void;
}

export function AllDayBanner({
  dateStr,
  eventsVersion,
  onRequestCreate,
  onRequestEdit,
}: AllDayBannerProps) {
  const events = useMemo(
    () => getAllDayEventsForDay(dateStr),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateStr, eventsVersion],
  );

  return (
    <div
      className="flex shrink-0 items-start gap-3 border-b border-border bg-canvas px-3 py-2 sm:px-4"
      data-testid="all-day-banner"
    >
      <span
        aria-hidden
        className="type-label mt-1 shrink-0 font-semibold uppercase tracking-wider text-muted-foreground"
      >
        All day
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {events.length === 0 ? (
          <span className="type-meta italic text-muted-foreground">
            No all-day events
          </span>
        ) : (
          events.map((event) => {
            const category = getCategoryOrFallback(event.categoryId);
            const palette = paletteFor(category.colorKey);
            const title = event.title.trim() || "Untitled";
            const tooltip = [
              title,
              category.label,
              event.important ? "important" : null,
            ]
              .filter(Boolean)
              .join(" \u00b7 ");
            return (
              <button
                key={event.id}
                type="button"
                title={tooltip}
                aria-label={tooltip}
                onClick={() => onRequestEdit(event.id)}
                style={{ backgroundColor: palette.bg, color: palette.text }}
                className={cn(
                  "type-caption max-w-full truncate rounded-md px-2 py-0.5 text-left transition-shadow hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  event.important ? "font-semibold" : "font-medium",
                )}
                data-testid={`all-day-pill-${event.id}`}
              >
                {title}
              </button>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => onRequestCreate(dateStr)}
        className="type-label mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-foreground transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        aria-label="Add all-day event"
        data-testid="button-add-all-day"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        <span>Add</span>
      </button>
    </div>
  );
}
