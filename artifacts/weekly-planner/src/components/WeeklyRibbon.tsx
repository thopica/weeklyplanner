import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { PlannerData } from "@/lib/types";

interface WeeklyRibbonProps {
  selectedDate: Date;
  onSelectDate: (dateStr: string) => void;
  plannerData: PlannerData;
}

export function WeeklyRibbon({ selectedDate, onSelectDate, plannerData }: WeeklyRibbonProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTaskCount = (date: Date): { total: number; completed: number } => {
    const dateStr = date.toISOString().split("T")[0];
    const data = plannerData.days[dateStr];
    if (!data) return { total: 0, completed: 0 };
    const all = [...data.highPriorityTasks, ...data.generalTasks];
    return {
      total: all.length,
      completed: all.filter((t) => t.completed).length,
    };
  };

  return (
    <div
      className="flex items-center px-6 py-3 border-b border-border bg-card shrink-0 gap-1 overflow-x-auto scrollbar-hide"
      data-testid="weekly-ribbon"
    >
      {days.map((date) => {
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());
        const { total, completed } = getTaskCount(date);
        const remaining = total - completed;

        return (
          <button
            key={date.toISOString()}
            data-testid={`day-button-${format(date, "yyyy-MM-dd")}`}
            onClick={() => onSelectDate(date.toISOString().split("T")[0])}
            className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl transition-all duration-300 min-w-[64px] relative"
            style={{
              background: isSelected
                ? "hsl(var(--primary))"
                : isToday
                ? "hsl(var(--accent))"
                : "transparent",
              color: isSelected
                ? "hsl(var(--primary-foreground))"
                : isToday
                ? "hsl(var(--accent-foreground))"
                : "hsl(var(--muted-foreground))",
              outline: isToday && !isSelected ? "2px solid hsl(var(--primary))" : "none",
              outlineOffset: "-2px",
            }}
          >
            <span className="text-[10px] font-bold tracking-widest uppercase">
              {format(date, "EEE")}
            </span>
            <span
              className="text-xl font-serif font-bold"
              style={{ color: isSelected ? "hsl(var(--primary-foreground))" : undefined }}
            >
              {format(date, "d")}
            </span>

            {/* Task count badge */}
            {remaining > 0 ? (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                style={{
                  background: isSelected
                    ? "rgba(255,255,255,0.25)"
                    : "hsl(var(--primary))",
                  color: isSelected ? "#fff" : "hsl(var(--primary-foreground))",
                }}
              >
                {remaining}
              </span>
            ) : total > 0 ? (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: isSelected ? "rgba(255,255,255,0.15)" : "hsl(var(--secondary))",
                  color: isSelected ? "rgba(255,255,255,0.8)" : "hsl(var(--secondary-foreground))",
                }}
              >
                ✓
              </span>
            ) : (
              <span className="h-5" />
            )}
          </button>
        );
      })}

      <div className="ml-auto shrink-0 text-xs text-muted-foreground pr-2 font-medium">
        {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
      </div>
    </div>
  );
}
