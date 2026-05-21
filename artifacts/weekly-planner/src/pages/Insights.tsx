import { useMemo, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { tasteSpringContent } from "@/lib/motion";
import { PlannerHeader } from "@/components/PlannerHeader";
import { PeriodToggle } from "@/components/insights/PeriodToggle";
import { InsightsHero } from "@/components/insights/InsightsHero";
import { InsightCardGrid } from "@/components/insights/InsightCard";
import { TaskMomentumPanel } from "@/components/insights/TaskMomentumPanel";
import { HabitsMomentumPanel } from "@/components/insights/HabitsMomentumPanel";
import { getPlannerData, getHabits, getSelectedDate } from "@/lib/storage";
import {
  type InsightsPeriodDays,
  getInsightsDateRange,
  aggregateTaskInsights,
  aggregateHabitInsights,
  buildInsightsSummary,
} from "@/lib/insights";
import {
  deriveActionableInsights,
  pickCardInsights,
  pickHeroInsight,
} from "@/lib/insight-messages";

function insightsPeriodLabel(days: InsightsPeriodDays): string {
  return `Last ${days} days ending today`;
}

export default function InsightsPage() {
  const reduceMotion = useReducedMotion();
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

  const { tasks, habits, summary, hero, cards } = useMemo(() => {
    void dataVersion;
    const data = getPlannerData();
    const habitDefs = getHabits();
    const range = getInsightsDateRange(periodDays);
    const taskInsights = aggregateTaskInsights(data, range);
    const habitInsights = aggregateHabitInsights(data, habitDefs, range);
    const summaryInsights = buildInsightsSummary(taskInsights, habitInsights);
    const allInsights = deriveActionableInsights(taskInsights, habitInsights);
    const heroInsight = pickHeroInsight(allInsights);
    return {
      tasks: taskInsights,
      habits: habitInsights,
      summary: summaryInsights,
      hero: heroInsight,
      cards: pickCardInsights(allInsights, heroInsight, 3),
    };
  }, [periodDays, dataVersion]);

  const sectionStaggerParent = reduceMotion
    ? undefined
    : {
        hidden: {},
        show: {
          transition: { staggerChildren: 0.06, delayChildren: 0.02 },
        },
      };

  const sectionStaggerChild = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 6 },
        show: {
          opacity: 1,
          y: 0,
          transition: tasteSpringContent,
        },
      };

  return (
    <motion.div
      className="planner-canvas relative isolate flex h-dvh max-h-dvh min-h-dvh flex-col overflow-hidden bg-canvas"
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
        className="planner-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <motion.div
          className="mx-auto w-full max-w-4xl space-y-6 px-4 py-4 sm:px-5 sm:py-6"
          variants={sectionStaggerParent}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "show"}
        >
          <motion.div variants={sectionStaggerChild}>
            <h1 className="type-page-title text-foreground">Insights</h1>
            <p className="type-meta mt-1 text-muted-foreground">
              {insightsPeriodLabel(periodDays)}
            </p>
          </motion.div>

          <motion.div key={periodDays} variants={sectionStaggerChild}>
            <InsightsHero
              hero={hero}
              finishRate={tasks.finishRate}
              periodDays={periodDays}
              hasEnoughData={summary.hasEnoughData}
            />
          </motion.div>

          <motion.div variants={sectionStaggerChild}>
            <InsightCardGrid insights={cards} />
          </motion.div>

          <motion.div variants={sectionStaggerChild}>
            <TaskMomentumPanel tasks={tasks} />
          </motion.div>

          <motion.div variants={sectionStaggerChild}>
            <HabitsMomentumPanel habits={habits} />
          </motion.div>
        </motion.div>
      </main>
    </motion.div>
  );
}
