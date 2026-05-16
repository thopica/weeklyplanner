import type { InsightsPeriodDays } from "@/lib/insights";
import { cn } from "@/lib/utils";

const OPTIONS: { days: InsightsPeriodDays; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

interface PeriodToggleProps {
  value: InsightsPeriodDays;
  onChange: (days: InsightsPeriodDays) => void;
}

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Insights period"
      className="flex h-8 shrink-0 items-center rounded-lg border border-border bg-background p-0.5"
      data-testid="insights-period-toggle"
    >
      {OPTIONS.map(({ days, label }) => {
        const selected = value === days;
        return (
          <button
            key={days}
            type="button"
            role="tab"
            aria-selected={selected}
            data-testid={`insights-period-${days}`}
            onClick={() => onChange(days)}
            className={cn(
              "type-caption rounded-md px-2.5 py-1 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
