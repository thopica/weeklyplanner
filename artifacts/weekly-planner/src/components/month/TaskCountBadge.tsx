import { cn } from "@/lib/utils";

interface TaskCountBadgeProps {
  count: number;
  /** Dim the glyph (used for out-of-month cells). */
  dimmed?: boolean;
}

export function TaskCountBadge({ count, dimmed }: TaskCountBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} tasks`}
      className={cn(
        "type-meta tabular-nums",
        dimmed ? "text-muted-foreground/70" : "text-muted-foreground",
      )}
    >
      &bull; {count}
    </span>
  );
}
