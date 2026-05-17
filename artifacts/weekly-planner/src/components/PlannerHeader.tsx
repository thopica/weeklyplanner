import { useRef, type ReactNode } from "react";
import { format, getWeek } from "date-fns";
import { parseLocalDateStr } from "@/lib/dates";
import { Link } from "wouter";
import { Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PomodoroHeaderButton } from "@/components/pomodoro/PomodoroHeaderButton";
import { PlannerViewToggle } from "@/components/PlannerViewToggle";
import { formatMonthTitle } from "@/lib/month";
import { formatWorkweekRange, getWorkweekDays } from "@/lib/workweek";

interface PlannerHeaderProps {
  selectedDateStr: string;
  onSelectedDateChange: (dateStr: string) => void;
  /** When set, shows workweek range instead of single-day title. */
  viewMode?: "day" | "week" | "month";
  saveStatus?: "idle" | "saved";
  datePickerHidden?: boolean;
  trailing?: ReactNode;
}

export function PlannerHeader({
  selectedDateStr,
  onSelectedDateChange,
  viewMode = "day",
  saveStatus = "idle",
  datePickerHidden = false,
  trailing,
}: PlannerHeaderProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const selectedDate = parseLocalDateStr(selectedDateStr);
  const weekNumber = getWeek(selectedDate, { weekStartsOn: 1 });
  const year = format(selectedDate, "yyyy");
  const workweekDays = getWorkweekDays(selectedDateStr);
  const isWeekView = viewMode === "week";
  const isMonthView = viewMode === "month";

  const openDatePicker = () => {
    if (datePickerHidden) return;
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click();
  };

  const title = isWeekView
    ? formatWorkweekRange(workweekDays)
    : isMonthView
      ? formatMonthTitle(selectedDateStr)
      : format(selectedDate, "EEEE, MMM d");

  const ariaDateLabel = isWeekView
    ? `Week of ${formatWorkweekRange(workweekDays)}`
    : isMonthView
      ? formatMonthTitle(selectedDateStr)
      : format(selectedDate, "EEEE, MMMM d, yyyy");

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 sm:px-5">
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={openDatePicker}
          disabled={datePickerHidden}
          data-testid="button-header-date-picker"
          aria-label={
            datePickerHidden
              ? ariaDateLabel
              : isMonthView
                ? `Change month, currently ${ariaDateLabel}`
                : `Change date, currently ${ariaDateLabel}`
          }
          className="-ml-1 max-w-full rounded-lg border border-transparent px-2 py-1 text-left transition-colors hover:border-border hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:border-transparent disabled:hover:bg-transparent"
        >
          <h1 className="type-page-title truncate" data-testid="header-date">
            {title}
          </h1>
          <p className="type-meta mt-0.5 flex items-center gap-1 font-medium tabular-nums text-muted-foreground">
            <span>
              Week {weekNumber} · {year}
            </span>
            {!datePickerHidden ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            ) : null}
          </p>
        </button>
        {!datePickerHidden ? (
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDateStr}
            onChange={(e) => {
              if (e.target.value) onSelectedDateChange(e.target.value);
            }}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            tabIndex={-1}
            aria-hidden
          />
        ) : null}
      </div>

      <span className="sr-only" aria-live="polite">
        {saveStatus === "saved" ? "All changes saved" : ""}
      </span>
      {saveStatus === "saved" ? (
        <span className="type-caption hidden shrink-0 font-medium text-muted-foreground md:inline">
          Saved
        </span>
      ) : null}

      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        <PomodoroHeaderButton />
        <PlannerViewToggle />
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-settings"
          aria-label="Settings"
          className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
          asChild
        >
          <Link href="/settings">
            <Settings className="h-4 w-4" strokeWidth={2} />
          </Link>
        </Button>
      </div>
    </header>
  );
}
