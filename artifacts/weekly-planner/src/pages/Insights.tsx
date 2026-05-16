import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { PlannerHeader } from "@/components/PlannerHeader";
import { PeriodToggle } from "@/components/insights/PeriodToggle";
import { InsightsSummaryCards } from "@/components/insights/InsightsSummaryCards";
import { TaskInsightsPanel } from "@/components/insights/TaskInsightsPanel";
import { HabitInsightsPanel } from "@/components/insights/HabitInsightsPanel";
import { getPlannerData, getHabits, getSelectedDate } from "@/lib/storage";
import {
  type InsightsPeriodDays,
  getInsightsDateRange,
  aggregateTaskInsights,
  aggregateHabitInsights,
  buildInsightsSummary,
} from "@/lib/insights";

export default function InsightsPage() {
  const [location] = useLocation();
  const [selectedDateStr, setSelectedDateStr] = useState(() => getSelectedDate());
  const [periodDays, setPeriodDays] = useState<InsightsPeriodDays>(30);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (location === "/insights") {
      setSelectedDateStr(getSelectedDate());
      setDataVersion((v) => v + 1);
    }
  }, [location]);

  useEffect(() => {
    if (location !== "/insights") return;
    const refresh = () => setDataVersion((v) => v + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [location]);

  const { tasks, habits, summary } = useMemo(() => {
    void dataVersion;
    const data = getPlannerData();
    const habitDefs = getHabits();
    const range = getInsightsDateRange(periodDays);
    const taskInsights = aggregateTaskInsights(data, range);
    const habitInsights = aggregateHabitInsights(data, habitDefs, range);
    const summaryInsights = buildInsightsSummary(taskInsights, habitInsights);
    return {
      tasks: taskInsights,
      habits: habitInsights,
      summary: summaryInsights,
    };
  }, [periodDays, dataVersion]);

  return (
    <motion.div
      className="relative isolate flex h-dvh max-h-dvh min-h-dvh flex-col overflow-hidden bg-background"
      data-testid="insights-view-root"
    >
      <a
        href="#main-content"
        className="absolute left-3 top-0 z-100 -translate-y-20 rounded-lg bg-foreground px-4 py-2.5 type-ui font-medium text-background shadow-lg transition focus:translate-y-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to insights
      </a>

      <PlannerHeader
        selectedDateStr={selectedDateStr}
        onSelectedDateChange={setSelectedDateStr}
        viewMode="day"
        datePickerHidden
        trailing={<PeriodToggle value={periodDays} onChange={setPeriodDays} />}
      />

      <main
        id="main-content"
        className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-4 sm:px-5 sm:py-6">
          <div>
            <h1 className="type-page-title text-foreground">Insights</h1>
            <p className="type-meta mt-1 text-muted-foreground">
              Last {periodDays} days ending today
            </p>
          </div>

          {!summary.hasEnoughData ? (
            <p
              className="type-ui rounded-xl border border-border bg-card px-4 py-3 text-muted-foreground"
              data-testid="insights-low-data-notice"
            >
              Keep planning for a few more days to see meaningful trends.
            </p>
          ) : null}

          <InsightsSummaryCards summary={summary} />

          <TaskInsightsPanel tasks={tasks} />
          <HabitInsightsPanel habits={habits} />
        </div>
      </main>
    </motion.div>
  );
}
