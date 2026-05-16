import { Link } from "wouter";
import type { HabitInsightRow, HabitInsights } from "@/lib/insights";
import { HabitStreakVisual } from "@/components/insights/HabitStreakVisual";
import { cn } from "@/lib/utils";

interface HabitInsightsPanelProps {
  habits: HabitInsights;
}

function HabitCard({ row }: { row: HabitInsightRow }) {
  const { habit } = row;

  return (
    <article
      className="rounded-lg border border-border bg-surface-subtle px-3 py-3 sm:px-4"
      data-testid={`habit-insight-${habit.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="type-ui min-w-0 font-semibold text-foreground">{habit.name}</h3>
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

export function HabitInsightsPanel({ habits }: HabitInsightsPanelProps) {
  const noHabits = habits.habits.length === 0;

  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-labelledby="insights-habits-heading"
      data-testid="insights-habits-panel"
    >
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <h2 id="insights-habits-heading" className="type-section-title text-foreground">
          Habits
        </h2>
        <p className="type-section-desc mt-0.5 text-muted-foreground">
          Current streak — each square is one day (scroll for longer periods).
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
          habits.habits.map((row) => <HabitCard key={row.habit.id} row={row} />)
        )}
      </div>
    </section>
  );
}
