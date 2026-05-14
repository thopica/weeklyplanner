import { useRef } from "react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { PlannerData } from "@/lib/types";

interface WeeklyRibbonProps {
  selectedDate: Date;
  onSelectDate: (dateStr: string) => void;
  plannerData: PlannerData;
}

export function WeeklyRibbon({ selectedDate, onSelectDate, plannerData }: WeeklyRibbonProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isCurrentWeek = isSameDay(weekStart, todayWeekStart);

  const goToPrevWeek = () => {
    onSelectDate(format(subWeeks(selectedDate, 1), "yyyy-MM-dd"));
  };

  const goToNextWeek = () => {
    onSelectDate(format(addWeeks(selectedDate, 1), "yyyy-MM-dd"));
  };

  const goToToday = () => {
    onSelectDate(todayStr);
  };

  const handleDatePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) onSelectDate(e.target.value);
  };

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click();
  };

  const getTaskCount = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const data = plannerData.days[dateStr];
    if (!data) return { total: 0, completed: 0 };
    const all = [...data.highPriorityTasks, ...data.generalTasks];
    return { total: all.length, completed: all.filter((t) => t.completed).length };
  };

  return (
    <div
      className="flex items-center px-4 py-2 border-b border-border bg-card shrink-0 gap-0.5"
      data-testid="weekly-ribbon"
    >
      {/* Prev week */}
      <button
        onClick={goToPrevWeek}
        data-testid="button-prev-week"
        title="Previous week"
        className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Day buttons */}
      <div className="flex flex-1 items-center gap-0.5 min-w-0 overflow-x-auto scrollbar-hide">
        {days.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const isSelected = isSameDay(date, selectedDate);
          const isToday = dateStr === todayStr;
          const { total, completed } = getTaskCount(date);
          const remaining = total - completed;

          return (
            <button
              key={dateStr}
              data-testid={`day-button-${dateStr}`}
              onClick={() => onSelectDate(dateStr)}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[58px] flex-1"
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
              <span className="text-[10px] font-bold tracking-widest uppercase leading-none">
                {format(date, "EEE")}
              </span>
              <span className="text-xl font-serif font-bold leading-tight">
                {format(date, "d")}
              </span>
              {/* Badge */}
              <span className="h-4 flex items-center justify-center">
                {remaining > 0 ? (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none"
                    style={{
                      background: isSelected ? "rgba(255,255,255,0.28)" : "hsl(var(--primary))",
                      color: isSelected ? "#fff" : "hsl(var(--primary-foreground))",
                    }}
                  >
                    {remaining}
                  </span>
                ) : total > 0 ? (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{
                      background: isSelected ? "rgba(255,255,255,0.18)" : "hsl(var(--secondary))",
                      color: isSelected ? "rgba(255,255,255,0.85)" : "hsl(var(--secondary-foreground))",
                    }}
                  >
                    ✓
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next week */}
      <button
        onClick={goToNextWeek}
        data-testid="button-next-week"
        title="Next week"
        className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-1 shrink-0" />

      {/* Go to today (only shown when not on current week) */}
      {!isCurrentWeek && (
        <button
          onClick={goToToday}
          data-testid="button-go-today"
          title="Go to today"
          className="px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shrink-0"
          style={{
            background: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          Today
        </button>
      )}

      {/* Date picker */}
      <div className="relative shrink-0">
        <button
          onClick={openDatePicker}
          data-testid="button-date-picker"
          title="Jump to date"
          className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <CalendarDays className="w-4 h-4" />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={format(selectedDate, "yyyy-MM-dd")}
          onChange={handleDatePicker}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          style={{ zIndex: -1 }}
          aria-label="Pick a specific date"
        />
      </div>

      {/* Week label */}
      <span className="hidden md:block text-[10px] text-muted-foreground font-semibold tracking-wide shrink-0 ml-1 pl-2 border-l border-border">
        {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
      </span>
    </div>
  );
}
