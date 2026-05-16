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
          variant === "ribbon" ? "h-1.5 w-full" : "shrink-0",
          className,
        )}
        aria-label={ariaLabel}
      >
        <Check
          className={cn(
            "h-2.5 w-2.5 shrink-0",
            isSelected && variant === "ribbon"
              ? "text-primary-foreground/75"
              : "text-secondary",
          )}
          strokeWidth={2.5}
          aria-hidden
        />
      </span>
    );
  }

  if (!summary.hasOpen) return null;

  const dotClass =
    variant === "ribbon"
      ? isSelected
        ? "bg-primary-foreground/80"
        : isPastDay
          ? "bg-muted-foreground/45"
          : "bg-primary/70"
      : isToday
        ? "bg-primary-foreground/80"
        : isPastDay
          ? "bg-muted-foreground/45"
          : "bg-primary/70";

  if (variant === "header") {
    return (
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass, className)}
        title={ariaLabel}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <span
      className={cn("flex h-1.5 w-full items-center justify-center", className)}
      aria-hidden
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", dotClass)}
        title={ariaLabel}
      />
    </span>
  );
}
