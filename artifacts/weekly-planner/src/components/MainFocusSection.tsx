import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import { tasteSpringToggle, tasteTransition } from "@/lib/motion";
import { PlannerSection } from "@/components/PlannerSection";
import { cn } from "@/lib/utils";

interface MainFocusSectionProps {
  focus: string;
  completed: boolean;
  onChange: (focus: string) => void;
  onToggle: () => void;
  scheduleVisible?: boolean;
  onShowSchedule?: () => void;
}

export function MainFocusSection({
  focus,
  completed,
  onChange,
  onToggle,
  scheduleVisible = true,
  onShowSchedule,
}: MainFocusSectionProps) {
  const reduceMotion = useReducedMotion();
  return (
    <PlannerSection
      variant="default"
      layout="standalone"
      step={1}
      id="focus"
      title="Today's main focus"
      description={
        scheduleVisible
          ? "One outcome for today. Block time for it in the schedule column."
          : "One outcome for today. Open the schedule when you are ready to block time."
      }
      data-testid="main-focus-section"
    >
      <div>
        <div className="relative">
          <input
            type="text"
            value={focus}
            onChange={(e) => onChange(e.target.value)}
            placeholder="What is the one thing you must accomplish today?"
            data-testid="input-main-focus"
            disabled={completed}
            className={cn(
              "w-full rounded-md border border-border bg-background py-3 pl-3 pr-12 text-lead font-semibold shadow-sm transition-colors",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring motion-reduce:transition-none sm:pr-14",
              completed
                ? "cursor-default border-border bg-surface-subtle text-foreground-subtle line-through"
                : "text-foreground",
            )}
          />
          <button
            type="button"
            onClick={onToggle}
            data-testid="button-focus-complete"
            title={completed ? "Mark as incomplete" : "Mark as complete"}
            className={cn(
              "absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full transition-transform hover:scale-105 motion-reduce:hover:scale-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              completed ? "text-secondary" : "text-primary",
            )}
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
        </div>

        {completed && focus && (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tasteTransition(reduceMotion, tasteSpringToggle)}
            className="mt-2 type-caption font-semibold text-muted-foreground"
          >
            Accomplished
          </motion.p>
        )}

        {!scheduleVisible && onShowSchedule && (
          <button
            type="button"
            onClick={onShowSchedule}
            className="mt-3 type-ui font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid="button-open-schedule-from-focus"
          >
            Open schedule
          </button>
        )}
      </div>
    </PlannerSection>
  );
}
