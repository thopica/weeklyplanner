import { Droplets } from "lucide-react";
import { motion } from "framer-motion";

interface WaterTrackerProps {
  count: number;
  onChange: (count: number) => void;
  compact?: boolean;
}

export function WaterTracker({ count, onChange, compact = false }: WaterTrackerProps) {
  const maxGlasses = 8;

  const toggleGlass = (index: number) => {
    if (index === count - 1) {
      onChange(index);
    } else {
      onChange(index + 1);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4" data-testid="water-tracker-compact">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Hydration
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: maxGlasses }).map((_, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.75 }}
              onClick={() => toggleGlass(i)}
              className="focus:outline-none"
              data-testid={`water-drop-${i}`}
              title={`${i + 1} glass${i !== 0 ? "es" : ""}`}
            >
              <Droplets
                className="w-5 h-5 transition-all duration-300"
                style={{
                  color: i < count ? "hsl(var(--primary))" : "hsl(var(--border))",
                  fill: i < count ? "hsl(var(--primary) / 0.35)" : "none",
                  strokeWidth: 1.5,
                }}
              />
            </motion.button>
          ))}
        </div>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {count}/{maxGlasses}
        </span>
      </div>
    );
  }

  return (
    <div
      className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-card-border mb-6"
      data-testid="water-tracker"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
          Hydration
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {count} / {maxGlasses}
        </span>
      </div>
      <div className="flex justify-between items-center gap-1">
        {Array.from({ length: maxGlasses }).map((_, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.8 }}
            onClick={() => toggleGlass(i)}
            className="focus:outline-none"
            data-testid={`water-drop-${i}`}
          >
            <Droplets
              className="w-6 h-6 md:w-8 md:h-8 transition-colors duration-500"
              style={{
                fill: i < count ? "hsl(var(--primary))" : "transparent",
                color: i < count ? "hsl(var(--primary))" : "hsl(var(--muted))",
                strokeWidth: 1.5,
              }}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
