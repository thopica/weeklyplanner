import { cn } from "@/lib/utils";

export type PlannerFieldSize = "sm" | "md" | "lg";

const sizeClasses: Record<PlannerFieldSize, string> = {
  sm: "planner-field-sm",
  md: "px-3 py-2 type-ui",
  lg: "planner-field-lg",
};

/** Shared day-view input/textarea surface — inset fill, border, soft shadow. */
export function plannerFieldClass(
  size: PlannerFieldSize = "md",
  className?: string,
): string {
  return cn(
    "planner-field w-full rounded-md motion-reduce:transition-none",
    sizeClasses[size],
    className,
  );
}
