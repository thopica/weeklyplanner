import { useState, useEffect, useRef } from "react";
import { format, parseISO, getWeek } from "date-fns";
import { Link, useLocation } from "wouter";
import { Settings, Palette, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getSelectedDate,
  saveSelectedDate,
  getDayData,
  saveDayData,
  getPlannerData,
  getTheme,
  saveTheme,
  getScheduleRange,
  getScheduleVisible,
  saveScheduleVisible,
  getHabits,
} from "@/lib/storage";
import { DayData, HabitDefinition, PlannerData } from "@/lib/types";
import { themes } from "@/lib/themes";
import { WeeklyRibbon } from "@/components/WeeklyRibbon";
import { MainFocusSection } from "@/components/MainFocusSection";
import { TaskList } from "@/components/TaskList";
import { TimeBlockSchedule } from "@/components/TimeBlockSchedule";
import { HabitsSection } from "@/components/HabitsSection";
import { GratitudeSection } from "@/components/GratitudeSection";
import { BrainDump } from "@/components/BrainDump";
import { SchedulePaneResizeHandle } from "@/components/SchedulePaneResizeHandle";
import { useSchedulePaneResize } from "@/hooks/use-schedule-pane-resize";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  tasteSpringContent,
  tasteSpringPopover,
  tasteTransition,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getSelectedDate());
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [plannerData, setPlannerData] = useState<PlannerData>(getPlannerData());
  const [scheduleRange, setScheduleRange] = useState(() => getScheduleRange());
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(() => getScheduleVisible());
  const [habits, setHabits] = useState<HabitDefinition[]>(() => getHabits());
  const { schedulePaneWidth, resizeHandleProps } = useSchedulePaneResize();
  const themePickerRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const loadData = () => {
    setDayData(getDayData(selectedDateStr));
    setPlannerData(getPlannerData());
    setScheduleRange(getScheduleRange());
    setHabits(getHabits());
  };

  useEffect(() => {
    saveSelectedDate(selectedDateStr);
    loadData();
  }, [selectedDateStr]);

  useEffect(() => {
    if (location === "/") {
      loadData();
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target as Node)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === "s" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setScheduleVisible((visible) => {
          const next = !visible;
          saveScheduleVisible(next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!dayData) return null;

  const handleDataChange = (newData: DayData) => {
    setDayData(newData);
    saveDayData(selectedDateStr, newData);
    setPlannerData(getPlannerData());
    setSaveStatus("saved");
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    saveTheme(themeId);
    setShowThemePicker(false);
  };

  const toggleScheduleVisible = () => {
    const next = !scheduleVisible;
    setScheduleVisible(next);
    saveScheduleVisible(next);
  };

  const selectedDate = parseISO(selectedDateStr);
  const weekNumber = getWeek(selectedDate, { weekStartsOn: 1 });
  const year = format(selectedDate, "yyyy");

  const allTasks = [...dayData.highPriorityTasks, ...dayData.generalTasks];
  const activeTheme = themes.find((t) => t.id === currentTheme) ?? themes[0];

  const showSchedule = () => {
    if (!scheduleVisible) toggleScheduleVisible();
  };

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click();
  };

  return (
    <motion.div
      className="relative isolate flex h-dvh max-h-dvh min-h-dvh flex-col overflow-hidden bg-background"
      data-testid="app-root"
    >
      <a
        href="#main-content"
        className="absolute left-3 top-0 z-100 -translate-y-20 rounded-lg bg-foreground px-4 py-2.5 type-ui font-medium text-background shadow-lg transition focus:translate-y-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to planner
      </a>

      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 sm:px-5">
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={openDatePicker}
            data-testid="button-header-date-picker"
            aria-label={`Change date, currently ${format(selectedDate, "EEEE, MMMM d, yyyy")}`}
            className="-ml-1 max-w-full rounded-lg border border-transparent px-2 py-1 text-left transition-colors hover:border-border hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h1 className="type-page-title truncate" data-testid="header-date">
              {format(selectedDate, "EEEE, MMM d")}
            </h1>
            <p className="type-meta mt-0.5 flex items-center gap-1 font-medium tabular-nums text-muted-foreground">
              <span>
                Week {weekNumber} · {year}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            </p>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDateStr}
            onChange={(e) => {
              if (e.target.value) setSelectedDateStr(e.target.value);
            }}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
            tabIndex={-1}
            aria-hidden
          />
        </div>

        <span className="sr-only" aria-live="polite">
          {saveStatus === "saved" ? "All changes saved" : ""}
        </span>
        {saveStatus === "saved" ? (
          <span className="type-caption hidden shrink-0 font-medium text-muted-foreground md:inline">
            Saved
          </span>
        ) : null}

        <div className="flex shrink-0 items-center gap-1">
          <div className="relative" ref={themePickerRef}>
            <button
              type="button"
              data-testid="button-theme-picker"
              onClick={() => setShowThemePicker((v) => !v)}
              aria-label="Choose color theme"
              aria-expanded={showThemePicker}
              className="type-caption flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2 font-semibold text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Palette className="h-3.5 w-3.5" strokeWidth={2} style={{ color: activeTheme.color }} />
              <span className="hidden text-foreground sm:inline">{activeTheme.name}</span>
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: activeTheme.color }}
              />
            </button>

            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={tasteTransition(reduceMotion, tasteSpringPopover)}
                  className="absolute right-0 top-9 z-50 flex w-48 flex-col gap-1 rounded-xl border border-border bg-card p-1.5 shadow-tinted"
                >
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      data-testid={`button-theme-${theme.id}`}
                      onClick={() => handleThemeChange(theme.id)}
                      className="type-caption flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        background: theme.id === currentTheme ? "hsl(var(--accent))" : "transparent",
                        border:
                          theme.id === currentTheme
                            ? "1.5px solid hsl(var(--primary))"
                            : "1.5px solid transparent",
                      }}
                    >
                      <div
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{ background: theme.color }}
                      />
                      {theme.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

      <main id="main-content" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav aria-label="Week" className="shrink-0">
          <WeeklyRibbon
            selectedDate={selectedDate}
            onSelectDate={setSelectedDateStr}
            plannerData={plannerData}
            scheduleVisible={scheduleVisible}
            onToggleSchedule={toggleScheduleVisible}
          />
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDateStr}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={tasteTransition(reduceMotion, tasteSpringContent)}
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              "max-lg:overflow-y-auto max-lg:scrollbar-hide",
              scheduleVisible ? "lg:flex-row lg:overflow-hidden" : "lg:overflow-hidden",
            )}
          >
            {/* Left: one scrollable column — five section cards */}
            <motion.div
              className={cn(
                "order-1 min-w-0 flex-1",
                "max-lg:overflow-visible",
                "lg:order-none lg:min-h-0 lg:overflow-hidden",
              )}
            >
              <motion.div
                className={cn(
                  "px-4 py-3 sm:px-5",
                  "max-lg:overflow-visible",
                  "lg:scrollbar-hide lg:h-full lg:overflow-y-auto",
                )}
              >
                <MainFocusSection
                  focus={dayData.mainFocus}
                  completed={dayData.mainFocusCompleted ?? false}
                  onChange={(focus) => handleDataChange({ ...dayData, mainFocus: focus })}
                  onToggle={() =>
                    handleDataChange({
                      ...dayData,
                      mainFocusCompleted: !dayData.mainFocusCompleted,
                    })
                  }
                  scheduleVisible={scheduleVisible}
                  onShowSchedule={showSchedule}
                />
                <TaskList
                  title="Today's tasks"
                  tasks={allTasks}
                  onChange={(tasks) =>
                    handleDataChange({ ...dayData, highPriorityTasks: tasks, generalTasks: [] })
                  }
                  accentColor="primary"
                />
                <GratitudeSection
                  items={dayData.gratitude}
                  onChange={(items) => handleDataChange({ ...dayData, gratitude: items })}
                />
                <BrainDump
                  text={dayData.brainDump}
                  onChange={(text) => handleDataChange({ ...dayData, brainDump: text })}
                />
                <HabitsSection
                  habits={habits}
                  logs={dayData.habitLogs ?? {}}
                  onChange={(habitLogs) =>
                    handleDataChange({ ...dayData, habitLogs })
                  }
                />
              </motion.div>
            </motion.div>

            <AnimatePresence initial={false}>
              {scheduleVisible && (
                <>
                  <SchedulePaneResizeHandle
                    {...resizeHandleProps}
                    aria-label="Resize schedule panel"
                    data-testid="schedule-pane-resize-handle"
                  />
                  <motion.section
                    id="schedule"
                    aria-label="Day schedule"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={tasteTransition(reduceMotion, tasteSpringContent)}
                    style={{ width: schedulePaneWidth }}
                    className={cn(
                      "order-2 flex w-full flex-col border-t border-border",
                      "max-lg:h-auto max-lg:shrink-0 max-lg:!w-full",
                      "lg:order-none lg:h-full lg:min-h-0 lg:max-w-[70vw] lg:shrink-0 lg:overflow-hidden lg:border-l lg:border-t-0",
                    )}
                  >
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <TimeBlockSchedule
                      range={scheduleRange}
                      blocks={dayData.timeBlocks}
                      onChange={(blocks) => handleDataChange({ ...dayData, timeBlocks: blocks })}
                    />
                  </div>
                  </motion.section>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

      </main>

      <footer className="shrink-0 border-t border-border bg-card px-4 py-2 sm:px-5">
        <div className="type-caption flex flex-col gap-1.5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Your plan stays on this device. Export anytime from Settings if you want a backup.
          </p>
          <nav className="flex shrink-0 gap-4" aria-label="Legal">
            <Link href="/privacy" className="font-medium text-foreground/85 hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="font-medium text-foreground/85 hover:underline">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </motion.div>
  );
}
