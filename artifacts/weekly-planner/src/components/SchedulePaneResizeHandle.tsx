import { cn } from "@/lib/utils";

type SchedulePaneResizeHandleProps = React.HTMLAttributes<HTMLDivElement>;

export function SchedulePaneResizeHandle({
  className,
  ...props
}: SchedulePaneResizeHandleProps) {
  return (
    <div
      {...props}
      className={cn(
        "group relative hidden w-2 shrink-0 cursor-col-resize touch-none lg:block",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-border-strong group-active:bg-primary"
        aria-hidden
      />
    </div>
  );
}
