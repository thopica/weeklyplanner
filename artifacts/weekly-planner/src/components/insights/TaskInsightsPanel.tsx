import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import type { TaskInsights } from "@/lib/insights";
import { formatInsightsBacklogAge } from "@/lib/insights";

interface TaskInsightsPanelProps {
  tasks: TaskInsights;
}

function MetricRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <span className="type-ui text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="type-ui font-semibold tabular-nums text-foreground">{value}</span>
        {detail ? (
          <p className="type-caption mt-0.5 text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

function formatPercent(n: number | null): string {
  if (n === null) return "—";
  return `${n}%`;
}

export function TaskInsightsPanel({ tasks }: TaskInsightsPanelProps) {
  const { range } = tasks;
  const noTasks = tasks.totalTasks === 0;

  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-labelledby="insights-tasks-heading"
      data-testid="insights-tasks-panel"
    >
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <h2 id="insights-tasks-heading" className="type-section-title text-foreground">
          Tasks
        </h2>
        <p className="type-section-desc mt-0.5 text-muted-foreground">
          Completion in each day&apos;s list — not when you checked them off.
        </p>
      </header>

      <div className="px-4 py-3 sm:px-5">
        {noTasks ? (
          <p className="type-ui py-4 text-muted-foreground">
            No tasks in this period. Add tasks on the{" "}
            <Link href="/" className="font-medium text-primary underline-offset-2 hover:underline">
              day planner
            </Link>{" "}
            to see trends.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <p className="type-label mb-2 text-muted-foreground">Weekly finish rate</p>
              {tasks.weeklyBuckets.length === 0 ? (
                <p className="type-ui text-muted-foreground">Not enough data</p>
              ) : (
                <ul className="flex items-end gap-2" aria-label="Weekly task completion">
                  {tasks.weeklyBuckets.map((bucket) => (
                    <li
                      key={bucket.weekStartStr}
                      className="flex min-w-0 flex-1 flex-col items-center gap-1"
                    >
                      <div className="flex h-20 w-full items-end justify-center">
                        <div
                          className="w-full max-w-[2.5rem] rounded-t-md bg-primary/80"
                          style={{
                            height:
                              bucket.finishRate === null
                                ? "4px"
                                : `${Math.max(8, bucket.finishRate)}%`,
                          }}
                          title={
                            bucket.finishRate === null
                              ? "No tasks"
                              : `${bucket.finishRate}%`
                          }
                        />
                      </div>
                      <span className="type-caption text-muted-foreground">{bucket.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="divide-y divide-border rounded-lg border border-border bg-surface-subtle px-3">
              <MetricRow
                label="Planning days"
                value={`${tasks.activePlanningDays} / ${tasks.calendarDays}`}
                detail="Days with at least one task"
              />
              <MetricRow
                label="Open backlog"
                value={
                  tasks.openBacklogTaskCount === 0
                    ? "None"
                    : `${tasks.openBacklogTaskCount} tasks`
                }
                detail={
                  tasks.oldestOpenBacklogDateStr
                    ? `Oldest: ${format(parseISO(tasks.oldestOpenBacklogDateStr), "MMM d")} (${formatInsightsBacklogAge(tasks.oldestOpenBacklogDateStr, range.endDateStr)})`
                    : tasks.openBacklogDayCount > 0
                      ? `${tasks.openBacklogDayCount} past days with open tasks`
                      : undefined
                }
              />
              <MetricRow
                label="Same-day planning"
                value={formatPercent(tasks.sameDayPlanningPercent)}
                detail="Tasks added on the day they're assigned to"
              />
              <MetricRow
                label="High-priority finish rate"
                value={formatPercent(tasks.highPriorityFinishRate)}
              />
              <MetricRow
                label="General finish rate"
                value={formatPercent(tasks.generalFinishRate)}
              />
              <MetricRow
                label="Avg tasks per active day"
                value={
                  tasks.avgTasksPerActiveDay === null
                    ? "—"
                    : String(tasks.avgTasksPerActiveDay)
                }
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
