import { format } from "date-fns";
import { parseLocalDateStr } from "@/lib/dates";
import type { HabitInsights, TaskInsights } from "@/lib/insights";
import { formatInsightsBacklogAge } from "@/lib/insights";

export type InsightTone = "celebrate" | "neutral" | "nudge";
export type InsightKind = "momentum" | "tasks" | "habits" | "backlog";

export interface ActionableInsight {
  id: string;
  tone: InsightTone;
  kind: InsightKind;
  title: string;
  body: string;
  metric?: string;
  href?: string;
  hrefLabel?: string;
  priority: number;
}

function finishRateForSnapshots(
  snapshots: { total: number; completed: number }[],
): number | null {
  let total = 0;
  let completed = 0;
  for (const s of snapshots) {
    total += s.total;
    completed += s.completed;
  }
  if (total === 0) return null;
  return Math.round((completed / total) * 100);
}

function cleanSweepStreakEndingToday(
  snapshots: TaskInsights["daySnapshots"],
  endDateStr: string,
): number {
  let streak = 0;
  for (let i = snapshots.length - 1; i >= 0; i--) {
    const snap = snapshots[i];
    if (snap.dateStr > endDateStr) continue;
    if (snap.total === 0) break;
    if (!snap.isCleanSweep) break;
    streak += 1;
  }
  return streak;
}

export function deriveActionableInsights(
  tasks: TaskInsights,
  habits: HabitInsights,
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];
  const { range } = tasks;
  const today = range.endDateStr;

  const hasTaskData = tasks.totalTasks > 0;
  const hasHabitData = habits.habits.some((h) => h.daysEligible >= 3);

  if (!hasTaskData && !hasHabitData) {
    insights.push({
      id: "getting-started",
      tone: "neutral",
      kind: "momentum",
      title: "Your story starts here",
      body: "Plan a few days with tasks or habits and we'll surface patterns that help you stay consistent.",
      href: "/",
      hrefLabel: "Open day planner",
      priority: 100,
    });
    return insights.sort((a, b) => b.priority - a.priority);
  }

  const sweepStreak = cleanSweepStreakEndingToday(tasks.daySnapshots, today);
  if (sweepStreak >= 2) {
    insights.push({
      id: "clean-sweep-streak",
      tone: "celebrate",
      kind: "tasks",
      title:
        sweepStreak >= 3 ? "You're on a roll" : "Nice finishing stretch",
      body: `${sweepStreak} days in a row with every task done. That's real follow-through.`,
      metric: `${sweepStreak} day${sweepStreak === 1 ? "" : "s"}`,
      priority: 95,
    });
  }

  if (tasks.cleanSweepDays >= 2 && sweepStreak < 2) {
    insights.push({
      id: "clean-sweep-days",
      tone: "celebrate",
      kind: "tasks",
      title: "Clear-the-board days",
      body: `You fully cleared your list on ${tasks.cleanSweepDays} days this period. Those days set you up for an easier tomorrow.`,
      metric: String(tasks.cleanSweepDays),
      priority: 70,
    });
  }

  const snaps = tasks.daySnapshots.filter((s) => s.total > 0);
  if (snaps.length >= 6) {
    const mid = Math.floor(snaps.length / 2);
    const firstHalf = finishRateForSnapshots(snaps.slice(0, mid));
    const secondHalf = finishRateForSnapshots(snaps.slice(mid));
    if (
      firstHalf !== null &&
      secondHalf !== null &&
      secondHalf - firstHalf >= 8
    ) {
      insights.push({
        id: "finish-trend-up",
        tone: "celebrate",
        kind: "momentum",
        title: "Completion is trending up",
        body: `You're finishing more in recent days (${secondHalf}%) than earlier in this period (${firstHalf}%).`,
        metric: `+${secondHalf - firstHalf}%`,
        priority: 85,
      });
    } else if (
      firstHalf !== null &&
      secondHalf !== null &&
      firstHalf - secondHalf >= 12
    ) {
      insights.push({
        id: "finish-trend-down",
        tone: "nudge",
        kind: "momentum",
        title: "A gentler stretch lately",
        body: `Earlier you were at ${firstHalf}% completion; recently ${secondHalf}%. Pick one small win today to rebuild rhythm.`,
        href: "/",
        hrefLabel: "Plan today",
        priority: 75,
      });
    }
  }

  if (tasks.activePlanningDays >= 3) {
    const pct = Math.round(
      (tasks.activePlanningDays / tasks.calendarDays) * 100,
    );
    if (pct >= 50) {
      insights.push({
        id: "planning-consistency",
        tone: "neutral",
        kind: "momentum",
        title: "Steady planning rhythm",
        body: `You planned on ${tasks.activePlanningDays} of ${tasks.calendarDays} days. Showing up regularly matters more than perfect days.`,
        metric: `${pct}%`,
        priority: 55,
      });
    }
  }

  if (tasks.openBacklogTaskCount > 0 && tasks.oldestOpenBacklogDateStr) {
    const age = formatInsightsBacklogAge(tasks.oldestOpenBacklogDateStr, today);
    const oldestLabel = format(
      parseLocalDateStr(tasks.oldestOpenBacklogDateStr),
      "MMM d",
    );
    insights.push({
      id: "backlog-nudge",
      tone: "nudge",
      kind: "backlog",
      title: "A few tasks still waiting",
      body:
        tasks.openBacklogTaskCount === 1
          ? `One task from ${oldestLabel} (${age}) is still open. Move it forward or finish it today.`
          : `${tasks.openBacklogTaskCount} tasks still open; oldest from ${oldestLabel} (${age}). Pick one for today.`,
      metric: String(tasks.openBacklogTaskCount),
      href: "/",
      hrefLabel: "Open planner",
      priority: 80,
    });
  }

  if (
    tasks.highPriorityFinishRate !== null &&
    tasks.generalFinishRate !== null &&
    tasks.highPriorityFinishRate - tasks.generalFinishRate >= 15
  ) {
    insights.push({
      id: "hp-gap",
      tone: "neutral",
      kind: "tasks",
      title: "Priorities get your attention",
      body: `High-priority tasks finish at ${tasks.highPriorityFinishRate}% vs ${tasks.generalFinishRate}% for general. Your focus lands where it counts.`,
      priority: 45,
    });
  }

  if (habits.perfectHabitDays >= 2 && habits.habits.length > 0) {
    insights.push({
      id: "perfect-habit-days",
      tone: "celebrate",
      kind: "habits",
      title: "Full habit days",
      body: `${habits.perfectHabitDays} days you hit every habit in this period. That's alignment across your whole routine.`,
      metric: String(habits.perfectHabitDays),
      priority: 72,
    });
  }

  if (habits.bestCurrentStreak >= 3) {
    insights.push({
      id: "habit-streak",
      tone: "celebrate",
      kind: "habits",
      title: "Habit streak going strong",
      body: `Your best current streak is ${habits.bestCurrentStreak} days. Consistency compounds.`,
      metric: `${habits.bestCurrentStreak} days`,
      priority: 88,
    });
  }

  const habitsWithRate = habits.habits.filter((h) => h.hitRate !== null && h.daysEligible >= 3);
  if (habitsWithRate.length >= 2) {
    const sorted = [...habitsWithRate].sort((a, b) => (b.hitRate ?? 0) - (a.hitRate ?? 0));
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    if ((strongest.hitRate ?? 0) - (weakest.hitRate ?? 0) >= 20) {
      insights.push({
        id: "habit-contrast",
        tone: "neutral",
        kind: "habits",
        title: "Where habits shine",
        body: `${strongest.habit.name} is at ${strongest.hitRate}% this period${strongest.currentStreak > 0 ? ` (${strongest.currentStreak}-day streak)` : ""}. ${weakest.habit.name} is at ${weakest.hitRate}%. A small daily reset could help.`,
        href: "/settings",
        hrefLabel: "Habit settings",
        priority: 50,
      });
    }
  } else if (habitsWithRate.length === 1 && (habitsWithRate[0].hitRate ?? 0) >= 70) {
    const h = habitsWithRate[0];
    insights.push({
      id: "habit-strong",
      tone: "celebrate",
      kind: "habits",
      title: `${h.habit.name} is sticking`,
      body: `You're at ${h.hitRate}% over this period${h.currentStreak > 0 ? ` with a ${h.currentStreak}-day streak` : ""}.`,
      priority: 65,
    });
  }

  if (tasks.finishRate !== null && tasks.totalTasks > 0 && insights.length < 3) {
    insights.push({
      id: "finish-rate",
      tone: tasks.finishRate >= 70 ? "celebrate" : "neutral",
      kind: "tasks",
      title:
        tasks.finishRate >= 80
          ? "Strong completion rate"
          : "Room to grow",
      body:
        tasks.finishRate >= 80
          ? `${tasks.finishRate}% of tasks marked done in this period. You're closing loops.`
          : `${tasks.finishRate}% of tasks completed. Finishing even one more per day adds up fast.`,
      metric: `${tasks.finishRate}%`,
      priority: 40,
    });
  }

  return insights.sort((a, b) => b.priority - a.priority);
}

export function pickHeroInsight(insights: ActionableInsight[]): ActionableInsight | null {
  if (insights.length === 0) return null;
  const celebrate = insights.find((i) => i.tone === "celebrate");
  return celebrate ?? insights[0];
}

export function pickCardInsights(
  insights: ActionableInsight[],
  hero: ActionableInsight | null,
  limit = 3,
): ActionableInsight[] {
  const rest = insights.filter((i) => i.id !== hero?.id);
  return rest.slice(0, limit);
}

/** Strongest / needs-attention habit ids for badges */
export function habitHighlightIds(habits: HabitInsights): {
  strongestId: string | null;
  needsAttentionId: string | null;
} {
  const eligible = habits.habits.filter((h) => h.hitRate !== null && h.daysEligible >= 3);
  if (eligible.length === 0) {
    return { strongestId: null, needsAttentionId: null };
  }
  const sorted = [...eligible].sort((a, b) => (b.hitRate ?? 0) - (a.hitRate ?? 0));
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  return {
    strongestId: strongest.habit.id,
    needsAttentionId:
      eligible.length >= 2 && (strongest.hitRate ?? 0) - (weakest.hitRate ?? 0) >= 15
        ? weakest.habit.id
        : null,
  };
}
