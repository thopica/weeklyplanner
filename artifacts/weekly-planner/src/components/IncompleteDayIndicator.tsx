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
          variant === "ribbon"
            ? "type-caption font-bold leading-none"
            : "type-caption font-semibold leading-none",
          isSelected && variant === "ribbon"
            ? "text-primary-foreground/75"
            : "text-secondary",
          className,
        )}
        aria-label={ariaLabel}
      >
        ✓
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
