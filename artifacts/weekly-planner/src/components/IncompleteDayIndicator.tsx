import { Check } from "lucide-react";
import type { DayTaskSummary } from "@/lib/tasks";
import { cn } from "@/lib/utils";

interface IncompleteDayIndicatorProps {
  summary: DayTaskSummary;
  /** Below day number in ribbon */
  variant?: "ribbon" | "header";
  isSelected?: boolean;
  isToday?: boolean;
  isPastDay?: boolean;
  className?: string;
}

export function IncompleteDayIndicator({
  summary,
  variant = "ribbon",
  isSelected = false,
  isToday = false,
  isPastDay = false,
  className,
}: IncompleteDayIndicatorProps) {
  if (!summary.hasTasks) return null;

  const ariaLabel = summary.hasOpen
    ? `${summary.openCount} open task${summary.openCount === 1 ? "" : "s"}`
    : "All tasks completed";

  if (summary.allDone) {
    return (
      <span
        className={cn(
          "flex items-center justify-center",
          variant === "ribbon" ? "h-3.5 w-full" : "shrink-0",
          className,
        )}
        aria-label={ariaLabel}
      >
        <Check
          className={cn(
            "h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4",
            isSelected && variant === "ribbon"
              ? "text-primary-foreground"
              : "text-secondary",
          )}
          strokeWidth={2.75}
          aria-hidden
        />
      </span>
    );
  }

  if (!summary.hasOpen) return null;

  const dotClass =
    variant === "ribbon"
      ? isSelected
        ? "bg-primary-foreground"
        : isPastDay
          ? "bg-muted-foreground/55"
          : "bg-primary"
      : isToday
        ? "bg-primary-foreground"
        : isPastDay
          ? "bg-muted-foreground/55"
          : "bg-primary";

  const dotSize =
    variant === "header" ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-2 w-2 sm:h-2.5 sm:w-2.5";

  if (variant === "header") {
    return (
      <span
        className={cn("shrink-0 rounded-full", dotSize, dotClass, className)}
        title={ariaLabel}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <span
      className={cn("flex h-3.5 w-full items-center justify-center sm:h-4", className)}
      aria-hidden
    >
      <span
        className={cn("rounded-full", dotSize, dotClass)}
        title={ariaLabel}
      />
    </span>
  );
}
