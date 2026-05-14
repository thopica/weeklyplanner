import { useState, useEffect, useRef } from "react";
import { format, parseISO, getWeek } from "date-fns";
import { Settings, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getSelectedDate, saveSelectedDate, getDayData, saveDayData,
  getPlannerData, getTheme, saveTheme,
} from "@/lib/storage";
import { DayData, PlannerData } from "@/lib/types";
import { themes } from "@/lib/themes";
import { WeeklyRibbon } from "@/components/WeeklyRibbon";
import { MainFocusSection } from "@/components/MainFocusSection";
import { TaskList } from "@/components/TaskList";
import { TimeBlockSchedule } from "@/components/TimeBlockSchedule";
import { WaterTracker } from "@/components/WaterTracker";
import { GratitudeSection } from "@/components/GratitudeSection";
import { BrainDump } from "@/components/BrainDump";
import { SettingsPanel } from "@/components/SettingsPanel";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getSelectedDate());
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [plannerData, setPlannerData] = useState<PlannerData>(getPlannerData());
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [showThemePicker, setShowThemePicker] = useState(false);
  const themePickerRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    setDayData(getDayData(selectedDateStr));
    setPlannerData(getPlannerData());
  };

  useEffect(() => {
    saveSelectedDate(selectedDateStr);
    loadData();
  }, [selectedDateStr]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target as Node)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!dayData) return null;

  const handleDataChange = (newData: DayData) => {
    setDayData(newData);
    saveDayData(selectedDateStr, newData);
    setPlannerData(getPlannerData());
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    saveTheme(themeId);
    setShowThemePicker(false);
  };

  const selectedDate = parseISO(selectedDateStr);
  const weekNumber = getWeek(selectedDate, { weekStartsOn: 1 });
  const year = format(selectedDate, "yyyy");

  // Merge both legacy arrays into one unified priority task list
  const allTasks = [...dayData.highPriorityTasks, ...dayData.generalTasks];
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;

  const activeTheme = themes.find((t) => t.id === currentTheme) ?? themes[0];

  return (
    <div
      className="h-screen flex flex-col bg-background overflow-hidden"
      data-testid="app-root"
    >
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-card shrink-0">
        <div>
          <h1
            className="text-3xl font-serif font-semibold tracking-tight text-foreground"
            data-testid="header-date"
          >
            {format(selectedDate, "EEEE, MMMM do")}
          </h1>
          <p className="text-[11px] mt-0.5 font-semibold tracking-widest uppercase text-muted-foreground">
            Week {weekNumber} · {year}
          </p>
        </div>

        {/* Progress dots */}
        {totalTasks > 0 && (
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-background border border-border">
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(totalTasks, 12) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-500"
                  style={{
                    background: i < completedTasks ? "hsl(var(--primary))" : "hsl(var(--border))",
                  }}
                />
              ))}
              {totalTasks > 12 && (
                <span className="text-[10px] text-muted-foreground font-bold ml-1">+{totalTasks - 12}</span>
              )}
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              {completedTasks}/{totalTasks}
            </span>
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Inline theme picker */}
          <div className="relative" ref={themePickerRef}>
            <button
              data-testid="button-theme-picker"
              onClick={() => setShowThemePicker((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border text-muted-foreground hover:text-foreground transition-all text-xs font-semibold"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: activeTheme.color }} />
              <span className="hidden sm:inline text-foreground">{activeTheme.name}</span>
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: activeTheme.color }}
              />
            </button>

            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 z-50 p-2 rounded-2xl shadow-xl border border-border bg-card w-52 flex flex-col gap-1"
                >
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      data-testid={`button-theme-${theme.id}`}
                      onClick={() => handleThemeChange(theme.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all"
                      style={{
                        background: theme.id === currentTheme ? "hsl(var(--accent))" : "transparent",
                        color: "hsl(var(--foreground))",
                        border: theme.id === currentTheme ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ background: theme.color }}
                      />
                      {theme.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <SettingsPanel
            trigger={
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-settings"
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl h-9 w-9"
              >
                <Settings className="w-4 h-4" />
              </Button>
            }
            selectedDateStr={selectedDateStr}
            onDataReset={loadData}
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
          />
        </div>
      </header>

      {/* ── WEEKLY RIBBON ── */}
      <WeeklyRibbon
        selectedDate={selectedDate}
        onSelectDate={setSelectedDateStr}
        plannerData={plannerData}
      />

      {/* ── MAIN 2-COLUMN BODY ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDateStr}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex flex-1 overflow-hidden"
        >
          {/* LEFT PANEL — focus + tasks + gratitude + brain dump + water bar */}
          <div
            className="flex flex-col border-r border-border overflow-hidden"
            style={{ width: "60%", minWidth: 320 }}
          >
            <div className="flex-1 overflow-y-auto px-8 py-7 scrollbar-hide">
              <MainFocusSection
                focus={dayData.mainFocus}
                completed={dayData.mainFocusCompleted ?? false}
                onChange={(focus) => handleDataChange({ ...dayData, mainFocus: focus })}
                onToggle={() =>
                  handleDataChange({ ...dayData, mainFocusCompleted: !dayData.mainFocusCompleted })
                }
              />
              <TaskList
                title="Priority Tasks"
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
            </div>

            {/* Water tracker — always visible at bottom */}
            <div className="shrink-0 border-t border-border px-8 py-4 bg-card">
              <WaterTracker
                count={dayData.waterGlasses}
                onChange={(count) => handleDataChange({ ...dayData, waterGlasses: count })}
                compact
              />
            </div>
          </div>

          {/* RIGHT PANEL — schedule (always visible) */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div
              className="shrink-0 px-6 py-3.5 border-b border-border bg-card"
            >
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "hsl(var(--primary))" }}>
                Schedule
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <TimeBlockSchedule
                blocks={dayData.timeBlocks}
                onChange={(blocks) => handleDataChange({ ...dayData, timeBlocks: blocks })}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
