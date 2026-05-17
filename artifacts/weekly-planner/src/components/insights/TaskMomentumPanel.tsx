import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import { parseLocalDateStr } from "@/lib/dates";
import type { TaskInsights } from "@/lib/insights";
import { formatInsightsBacklogAge } from "@/lib/insights";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { InsightsPanelShell } from "@/components/insights/InsightsPanelShell";
import { cn } from "@/lib/utils";

interface TaskMomentumPanelProps {
  tasks: TaskInsights;
}

const chartConfig = {
  finishRate: {
    label: "Finish rate",
    color: "hsl(var(--primary))",
  },
};

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
  if (n === null) return "N/A";
  return `${n}%`;
}

export function TaskMomentumPanel({ tasks }: TaskMomentumPanelProps) {
  const reduceMotion = useReducedMotion();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { range } = tasks;
  const noTasks = tasks.totalTasks === 0;

  const chartData = tasks.weeklyBuckets.map((b) => ({
    label: b.label,
    finishRate: b.finishRate ?? 0,
    hasData: b.finishRate !== null,
  }));

  return (
    <InsightsPanelShell
      headingId="insights-tasks-heading"
      title="Task momentum"
      description="How you showed up and what got finished."
      testId="insights-tasks-panel"
    >
      <div className="space-y-5 px-4 py-4 sm:px-5">
        {noTasks ? (
          <p className="type-ui text-muted-foreground">
            No tasks in this period. Add tasks on the{" "}
            <Link href="/" className="font-medium text-primary underline-offset-2 hover:underline">
              day planner
            </Link>{" "}
            to see trends.
          </p>
        ) : (
          <>
            <div>
              <p className="type-label mb-2 text-muted-foreground">Weekly finish rate</p>
              {chartData.length === 0 ? (
                <p className="type-ui text-muted-foreground">Not enough data</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-48 w-full">
                  <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) =>
                            item.payload?.hasData ? `${value}%` : "No tasks"
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="finishRate"
                      fill="var(--color-finishRate)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.label}
                          fillOpacity={entry.hasData ? 1 : 0.2}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </div>

            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger
                aria-expanded={detailsOpen}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-subtle px-3 py-2.5 text-left transition-colors hover:bg-accent/30"
              >
                <span className="type-ui font-semibold text-foreground">Details</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    !reduceMotion && "transition-transform",
                    detailsOpen && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
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
                        ? `Oldest: ${format(parseLocalDateStr(tasks.oldestOpenBacklogDateStr), "MMM d")} (${formatInsightsBacklogAge(tasks.oldestOpenBacklogDateStr, range.endDateStr)})`
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
                        ? "N/A"
                        : String(tasks.avgTasksPerActiveDay)
                    }
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
    </InsightsPanelShell>
  );
}
