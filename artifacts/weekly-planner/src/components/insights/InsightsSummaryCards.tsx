import type { InsightsSummary } from "@/lib/insights";

interface InsightsSummaryCardsProps {
  summary: InsightsSummary;
}

function SummaryCard({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  testId: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card px-4 py-3"
      data-testid={testId}
    >
      <p className="type-label text-muted-foreground">{label}</p>
      <p className="mt-1 text-title font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="type-caption mt-1 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function formatPercent(n: number | null): string {
  if (n === null) return "—";
  return `${n}%`;
}

export function InsightsSummaryCards({ summary }: InsightsSummaryCardsProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      data-testid="insights-summary-cards"
    >
      <SummaryCard
        label="Task finish rate"
        value={formatPercent(summary.taskFinishRate)}
        hint="Marked complete in each day's list"
        testId="summary-task-finish-rate"
      />
      <SummaryCard
        label="Clean sweep days"
        value={String(summary.cleanSweepDays)}
        hint="Every task done that day"
        testId="summary-clean-sweeps"
      />
      <SummaryCard
        label="Habit hit rate"
        value={formatPercent(summary.habitHitRate)}
        hint="Average across habits"
        testId="summary-habit-hit-rate"
      />
      <SummaryCard
        label="Best habit streak"
        value={summary.bestHabitStreak > 0 ? String(summary.bestHabitStreak) : "—"}
        hint="Current days in a row"
        testId="summary-best-streak"
      />
    </div>
  );
}
