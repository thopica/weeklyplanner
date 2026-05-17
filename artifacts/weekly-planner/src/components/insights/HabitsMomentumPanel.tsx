import { Link } from "wouter";
import type { HabitInsightRow, HabitInsights } from "@/lib/insights";
import { habitHighlightIds } from "@/lib/insight-messages";
import { HabitStreakVisual } from "@/components/insights/HabitStreakVisual";
import { cn } from "@/lib/utils";

interface HabitsMomentumPanelProps {
  habits: HabitInsights;
}

function HabitCard({
  row,
  badge,
}: {
  row: HabitInsightRow;
  badge: "strongest" | "attention" | null;
}) {
  const { habit } = row;

  return (
    <article
      className="rounded-lg border border-border bg-surface-subtle px-3 py-3 sm:px-4"
      data-testid={`habit-insight-${habit.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="type-ui font-semibold text-foreground">{habit.name}</h3>
            {badge === "strongest" ? (
              <span className="type-caption rounded-md bg-habit-done/15 px-1.5 py-0.5 font-semibold text-habit-done">
                Strongest
              </span>
            ) : null}
            {badge === "attention" ? (
              <span className="type-caption rounded-md bg-secondary/15 px-1.5 py-0.5 font-semibold text-secondary">
                Needs attention
              </span>
            ) : null}
          </div>
          {row.hitRate !== null ? (
            <p className="type-caption mt-1 text-muted-foreground">
              {row.hitRate}% hit rate · best streak {row.bestStreakInRange}d in period
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right" data-testid="habit-streak-count">
          <p className="type-label text-muted-foreground">Current streak</p>
          <p
            className={cn(
              "mt-0.5 text-display font-semibold leading-none tabular-nums",
              row.currentStreak > 0 ? "text-habit-done" : "text-muted-foreground",
            )}
            aria-label={`${row.currentStreak} day streak`}
          >
            {row.currentStreak}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <HabitStreakVisual
          habitName={habit.name}
          currentStreak={row.currentStreak}
          timeline={row.periodTimeline}
        />
      </div>
    </article>
  );
}

export function HabitsMomentumPanel({ habits }: HabitsMomentumPanelProps) {
  const noHabits = habits.habits.length === 0;
  const { strongestId, needsAttentionId } = habitHighlightIds(habits);

  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-labelledby="insights-habits-heading"
      data-testid="insights-habits-panel"
    >
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <h2 id="insights-habits-heading" className="type-section-title text-foreground">
          Habit momentum
        </h2>
        <p className="type-section-desc mt-0.5 text-muted-foreground">
          Streaks and consistency — each square is one day.
        </p>
      </header>

      <div className="space-y-3 px-4 py-3 sm:px-5">
        {noHabits ? (
          <p className="type-ui py-4 text-muted-foreground">
            No habits configured. Add habits in{" "}
            <Link
              href="/settings"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Settings
            </Link>{" "}
            to track streaks.
          </p>
        ) : (
          habits.habits.map((row) => {
            let badge: "strongest" | "attention" | null = null;
            if (row.habit.id === strongestId) badge = "strongest";
            else if (row.habit.id === needsAttentionId) badge = "attention";
            return <HabitCard key={row.habit.id} row={row} badge={badge} />;
          })
        )}
      </div>
    </section>
  );
}
