import { Droplets } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { tasteSpringToggle, tasteTransition } from "@/lib/motion";
import { PlannerSection } from "@/components/PlannerSection";
import { cn } from "@/lib/utils";

interface WaterTrackerProps {
  count: number;
  onChange: (count: number) => void;
  /** Match left-column sections (Brain Dump, Gratitude): heading + bordered body */
  embedded?: boolean;
}

export function WaterTracker({
  count,
  onChange,
  embedded = false,
}: WaterTrackerProps) {
  const maxGlasses = 8;
  const reduceMotion = useReducedMotion();
  const tapTransition = tasteTransition(reduceMotion, tasteSpringToggle);

  const toggleGlass = (index: number) => {
    if (index === count - 1) {
      onChange(index);
    } else {
      onChange(index + 1);
    }
  };

  if (embedded) {
    return (
      <PlannerSection
        variant="default"
        layout="standalone"
        step={5}
        id="hydration"
        title="Hydration"
        data-testid="water-tracker-embedded"
        headerEnd={
          <span className="type-caption font-bold tabular-nums text-muted-foreground">
            {count}/{maxGlasses}
          </span>
        }
      >
        <motion.div className="flex flex-wrap gap-1.5">
          {Array.from({ length: maxGlasses }).map((_, i) => (
            <motion.button
              key={i}
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.88 }}
              transition={tapTransition}
              onClick={() => toggleGlass(i)}
              className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              data-testid={`water-drop-${i}`}
              title={`${i + 1} glass${i !== 0 ? "es" : ""}`}
            >
              <Droplets
                className={cn(
                  "h-6 w-6 transition-colors duration-200 sm:h-7 sm:w-7 motion-reduce:duration-0",
                  i < count
                    ? "fill-surface-accent text-primary"
                    : "text-foreground-subtle",
                )}
                strokeWidth={1.75}
              />
            </motion.button>
          ))}
        </motion.div>
      </PlannerSection>
    );
  }

  return (
    <div
      className="mb-6 rounded-2xl border border-card-border bg-card p-4 shadow-sm md:p-6"
      data-testid="water-tracker"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-sans text-sm font-semibold text-primary">
          Hydration
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {count} / {maxGlasses}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: maxGlasses }).map((_, i) => (
          <motion.button
            key={i}
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.88 }}
            transition={tapTransition}
            onClick={() => toggleGlass(i)}
            className="focus:outline-none"
            data-testid={`water-drop-${i}`}
          >
            <Droplets
              className={cn(
                "h-6 w-6 transition-colors duration-500 md:h-8 md:w-8",
                i < count ? "fill-surface-accent text-primary" : "text-foreground-subtle",
              )}
              strokeWidth={1.5}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
