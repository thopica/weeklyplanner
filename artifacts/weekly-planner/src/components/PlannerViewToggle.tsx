import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

type PlannerView = "day" | "week" | "month" | "insights";

function viewFromLocation(location: string): PlannerView {
  if (location === "/week") return "week";
  if (location === "/month") return "month";
  if (location === "/insights") return "insights";
  return "day";
}

function pathForView(view: PlannerView): string {
  if (view === "week") return "/week";
  if (view === "month") return "/month";
  if (view === "insights") return "/insights";
  return "/";
}

export function PlannerViewToggle() {
  const [location, navigate] = useLocation();
  const view = viewFromLocation(location);

  const goTo = (next: PlannerView) => {
    if (next === view) return;
    navigate(pathForView(next));
  };

  return (
    <div
      role="tablist"
      aria-label="Planner view"
      className="flex h-8 shrink-0 items-center rounded-lg border border-border bg-background p-0.5"
    >
      {(
        [
          { id: "day" as const, label: "Day" },
          { id: "week" as const, label: "Week" },
          { id: "month" as const, label: "Month" },
          { id: "insights" as const, label: "Insights" },
        ] as const
      ).map(({ id, label }) => {
        const selected = view === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-testid={`view-toggle-${id}`}
            onClick={() => goTo(id)}
            className={cn(
              "type-caption min-w-[2.75rem] rounded-md px-1.5 py-1 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-[3.25rem] sm:px-2",
              id === "insights" && "min-w-[3.75rem] sm:min-w-[4.5rem]",
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
