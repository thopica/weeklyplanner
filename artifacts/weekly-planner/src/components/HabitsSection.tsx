import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import { tasteSpringToggle, tasteTransition } from "@/lib/motion";
import { PlannerSection } from "@/components/PlannerSection";
import { cn } from "@/lib/utils";
import {
  getHabitActual,
  getQuantifiableGoal,
  isQuantifiableHabitMet,
  normalizeHabitLog,
} from "@/lib/habits";
import type { HabitDefinition, HabitDayLog } from "@/lib/types";

interface HabitsSectionProps {
  habits: HabitDefinition[];
  logs: Record<string, HabitDayLog>;
  onChange: (logs: Record<string, HabitDayLog>) => void;
  step?: number;
}

const habitRowClass = (done: boolean) =>
  cn(
    "flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors",
    done && "border-primary/30 bg-surface-subtle/50",
  );

const habitNameClass = (done: boolean) =>
  cn(
    "shrink-0 text-sm font-medium",
    done ? "text-foreground-subtle line-through" : "text-foreground",
  );

/** Typing-only numeric field; no browser steppers. Width grows with digit count. */
const actualInputClass =
  "h-8 min-w-[2.75rem] max-w-[9rem] shrink-0 rounded-md border border-border bg-background px-2 text-sm font-medium tabular-nums text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function parseDigitsOnly(raw: string): number | undefined {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return undefined;
  const n = Number(digits);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function formatCount(n: number | undefined): string {
  return n === undefined ? "" : String(n);
}

function actualInputWidthCh(value: string): string {
  const len = Math.max(value.length, 1);
  return `${len + 1}ch`;
}

function HabitStatusIcon({ met }: { met: boolean }) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", met ? "text-secondary" : "text-primary")}
      aria-hidden={!met}
    >
      {met ? (
        <CheckCircle2 className="h-6 w-6" strokeWidth={2} aria-label="Goal reached" />
      ) : (
        <Circle className="h-6 w-6 opacity-40" strokeWidth={2} />
      )}
    </span>
  );
}

function QuantifiableHabitRow({
  habit,
  log,
  onChange,
}: {
  habit: HabitDefinition;
  log: HabitDayLog | undefined;
  onChange: (log: HabitDayLog) => void;
}) {
  const stored = normalizeHabitLog(log, habit);
  const goal = getQuantifiableGoal(habit, stored);
  const savedActual = getHabitActual(stored, habit);
  const unit = habit.unit?.trim() || "";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const displayValue = editing ? draft : formatCount(savedActual);
  const draftActual = parseDigitsOnly(draft);
  const effectiveActual = editing ? draftActual : savedActual;
  const previewLog: HabitDayLog =
    effectiveActual !== undefined ? { actual: effectiveActual } : {};
  const met = isQuantifiableHabitMet(previewLog, habit);

  const commitDraft = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "");
    const nextActual = parseDigitsOnly(digitsOnly);
    const next: HabitDayLog = {};
    if (stored.completed !== undefined) next.completed = stored.completed;
    if (nextActual !== undefined) next.actual = nextActual;
    onChange(next);
  };

  return (
    <li className={habitRowClass(met)} data-testid={`habit-row-${habit.id}`}>
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-2 overflow-hidden sm:gap-x-2.5">
        <span className={cn(habitNameClass(met), "max-w-[40%] truncate sm:max-w-none")} title={habit.name}>
          {habit.name}
        </span>

        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          <span className="type-caption font-medium">Goal </span>
          <span className={cn("font-semibold", met ? "text-foreground-subtle" : "text-foreground")}>
            {goal !== undefined ? goal.toLocaleString() : "—"}
          </span>
          {unit ? <span className="ml-1 type-caption">{unit}</span> : null}
        </span>

        <span className="type-caption shrink-0 font-medium text-muted-foreground">Actual</span>
        <input
          id={`habit-actual-${habit.id}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={displayValue}
          onFocus={() => {
            setEditing(true);
            setDraft(formatCount(savedActual));
          }}
          onBlur={() => {
            commitDraft(draft);
            setEditing(false);
          }}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          aria-label={`${habit.name} actual${unit ? ` in ${unit}` : ""}`}
          className={actualInputClass}
          style={{ width: actualInputWidthCh(displayValue || "1") }}
          data-testid={`habit-actual-${habit.id}`}
        />
      </div>

      <HabitStatusIcon met={met} />
    </li>
  );
}

function BooleanHabitRow({
  habit,
  completed,
  onToggle,
}: {
  habit: HabitDefinition;
  completed: boolean;
  onToggle: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <li className={habitRowClass(completed)} data-testid={`habit-row-${habit.id}`}>
      <span className={cn(habitNameClass(completed), "min-w-0 flex-1 truncate")} title={habit.name}>
        {habit.name}
      </span>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={completed}
        title={completed ? "Mark as incomplete" : "Mark as complete"}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 motion-reduce:hover:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          completed ? "text-secondary" : "text-primary",
        )}
        data-testid={`habit-toggle-${habit.id}`}
      >
        <motion.span
          className="flex items-center justify-center"
          initial={false}
          animate={{ scale: completed ? 1.06 : 1 }}
          transition={tasteTransition(reduceMotion, tasteSpringToggle)}
        >
          {completed ? (
            <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
          ) : (
            <Circle className="h-6 w-6" strokeWidth={2} />
          )}
        </motion.span>
      </button>
    </li>
  );
}

export function HabitsSection({
  habits,
  logs,
  onChange,
  step = 5,
}: HabitsSectionProps) {
  if (habits.length === 0) return null;

  const updateLog = (habitId: string, patch: HabitDayLog) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    onChange({
      ...logs,
      [habitId]: normalizeHabitLog({ ...logs[habitId], ...patch }, habit),
    });
  };

  const completedCount = habits.filter((h) => {
    const log = normalizeHabitLog(logs[h.id], h);
    if (h.kind === "boolean") return Boolean(log.completed);
    return isQuantifiableHabitMet(log, h);
  }).length;

  return (
    <PlannerSection
      variant="default"
      layout="standalone"
      step={step}
      id="habits"
      title="Daily habits"
      data-testid="habits-section"
      headerEnd={
        <span className="type-caption font-bold tabular-nums text-muted-foreground">
          {completedCount}/{habits.length}
        </span>
      }
    >
      <ul className="space-y-2">
        {habits.map((habit) =>
          habit.kind === "boolean" ? (
            <BooleanHabitRow
              key={habit.id}
              habit={habit}
              completed={Boolean(logs[habit.id]?.completed)}
              onToggle={() =>
                updateLog(habit.id, {
                  completed: !logs[habit.id]?.completed,
                })
              }
            />
          ) : (
            <QuantifiableHabitRow
              key={habit.id}
              habit={habit}
              log={logs[habit.id]}
              onChange={(next) =>
                onChange({
                  ...logs,
                  [habit.id]: normalizeHabitLog(next, habit),
                })
              }
            />
          ),
        )}
      </ul>
    </PlannerSection>
  );
}
