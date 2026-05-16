import { format, parseISO } from "date-fns";
import type { HabitDayStatus } from "@/lib/insights";
import { cn } from "@/lib/utils";

interface HabitStreakVisualProps {
  habitName: string;
  currentStreak: number;
  timeline: HabitDayStatus[];
}

const doneCellClass = "bg-secondary ring-1 ring-secondary/40";

export function HabitStreakVisual({
  habitName,
  currentStreak,
  timeline,
}: HabitStreakVisualProps) {
  const dayCount = timeline.length;

  if (dayCount === 0) {
    return (
      <p className="type-caption text-muted-foreground">No days in this period yet.</p>
    );
  }

  const cellClass =
    dayCount > 60 ? "h-2 w-2" : dayCount > 30 ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <div
      className="space-y-2"
      role="img"
      aria-label={`${habitName}: ${currentStreak} day streak across ${dayCount} days`}
    >
      <div className="scrollbar-hide overflow-x-auto overscroll-x-contain">
        <ul className="flex w-max min-w-full items-center gap-0.5">
          {timeline.map(({ dateStr, met }) => {
            const label = format(parseISO(dateStr), "EEE, MMM d");
            return (
              <li key={dateStr}>
                <span
                  className={cn(
                    "block shrink-0 rounded-sm transition-colors",
                    cellClass,
                    met && doneCellClass,
                    !met && "bg-destructive ring-1 ring-destructive/35",
                  )}
                  title={`${label}: ${met ? "done" : "missed"}`}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <ul className="flex items-center gap-3 type-caption text-muted-foreground">
        <li className="inline-flex items-center gap-1.5">
          <span className={cn("inline-block h-2 w-2 shrink-0 rounded-sm", doneCellClass)} />
          Done
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-sm bg-destructive ring-1 ring-destructive/35" />
          Missed
        </li>
      </ul>
    </div>
  );
}
