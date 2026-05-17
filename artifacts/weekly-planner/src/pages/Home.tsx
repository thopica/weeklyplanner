import { useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import {
  getSelectedDate,
  saveSelectedDate,
  getDayData,
  saveDayData,
  getPlannerData,
  getScheduleRange,
  getScheduleVisible,
  saveScheduleVisible,
  getHabits,
  savePlannerData,
} from "@/lib/storage";
import { DayData, HabitDefinition, PlannerData } from "@/lib/types";
import { mergeDayTasks, partitionDayTasks } from "@/lib/tasks";
import { moveTaskBetweenDays } from "@/lib/task-move";
import { toast } from "@/hooks/use-toast";
import { PlannerHeader } from "@/components/PlannerHeader";
import { WeeklyRibbon } from "@/components/WeeklyRibbon";
import { MainFocusSection } from "@/components/MainFocusSection";
import { TaskList } from "@/components/TaskList";
import { TimeBlockSchedule } from "@/components/TimeBlockSchedule";
import { HabitsSection } from "@/components/HabitsSection";
import { GratitudeSection } from "@/components/GratitudeSection";
import { BrainDump } from "@/components/BrainDump";
import { HomePageSkeleton } from "@/components/HomePageSkeleton";
import { SchedulePaneResizeHandle } from "@/components/SchedulePaneResizeHandle";
import { useSchedulePaneResize } from "@/hooks/use-schedule-pane-resize";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  tasteSpringContent,
  tasteTransition,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getSelectedDate());
  const [dayData, setDayData] = useState<DayData | null>(() => getDayData(getSelectedDate()));
  const [plannerData, setPlannerData] = useState<PlannerData>(getPlannerData());
  const [scheduleRange, setScheduleRange] = useState(() => getScheduleRange());
  const [scheduleVisible, setScheduleVisible] = useState(() => getScheduleVisible());
  const [habits, setHabits] = useState<HabitDefinition[]>(() => getHabits());
  const { schedulePaneWidth, resizeHandleProps } = useSchedulePaneResize();
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const loadData = (dateStr: string = selectedDateStr) => {
    setDayData(getDayData(dateStr));
    setPlannerData(getPlannerData());
    setScheduleRange(getScheduleRange());
    setHabits(getHabits());
  };

  useEffect(() => {
    saveSelectedDate(selectedDateStr);
    loadData(selectedDateStr);
  }, [selectedDateStr]);

  useEffect(() => {
    if (location !== "/") return;
    const dateStr = getSelectedDate();
    setSelectedDateStr(dateStr);
    loadData(dateStr);
  }, [location]);

  useEffect(() => {
    if (location !== "/") return;
    const refresh = () => loadData(selectedDateStr);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [location, selectedDateStr]);

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

  const handleDataChange = (newData: DayData) => {
    setDayData(newData);
    const result = saveDayData(selectedDateStr, newData);
    if (!result.ok) {
      toast({
        title: "Could not save",
        description: result.message,
        variant: "destructive",
      });
      return;
    }
    setPlannerData(getPlannerData());
    setSaveStatus("saved");
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const toggleScheduleVisible = () => {
    const next = !scheduleVisible;
    setScheduleVisible(next);
    saveScheduleVisible(next);
  };

  const handleMoveTask = (taskId: string, toDateStr: string) => {
    const data = getPlannerData();
    const next = moveTaskBetweenDays(data, taskId, selectedDateStr, toDateStr);
    if (!next) {
      toast({
        title: "Could not move task",
        description: "The task may already exist on that day.",
        variant: "destructive",
      });
      return;
    }
    const saveResult = savePlannerData(next);
    if (!saveResult.ok) {
      toast({
        title: "Could not save move",
        description: saveResult.message,
        variant: "destructive",
      });
      return;
    }
    setPlannerData(next);
    setDayData(getDayData(selectedDateStr));
    toast({
      title: "Task moved",
      description: format(parseISO(`${toDateStr}T12:00:00`), "EEEE, MMM d"),
    });
  };

  const selectedDate = parseISO(`${selectedDateStr}T12:00:00`);
  const allTasks = dayData ? mergeDayTasks(dayData) : [];

  const sectionStaggerParent = reduceMotion
    ? undefined
    : {
        hidden: {},
        show: {
          transition: { staggerChildren: 0.06, delayChildren: 0.02 },
        },
      };

  const sectionStaggerChild = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 6 },
        show: {
          opacity: 1,
          y: 0,
          transition: tasteSpringContent,
        },
      };

  const showSchedule = () => {
    if (!scheduleVisible) toggleScheduleVisible();
  };

  return (
    <motion.div
      className="relative isolate flex h-dvh max-h-dvh min-h-dvh flex-col overflow-hidden bg-background"
      data-testid="app-root"
    >
      <a
        href="#main-content"
        className="absolute left-3 top-0 z-[100] -translate-y-20 rounded-lg bg-foreground px-4 py-2.5 type-ui font-medium text-background shadow-lg transition focus:translate-y-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to planner
      </a>

      <PlannerHeader
        selectedDateStr={selectedDateStr}
        onSelectedDateChange={setSelectedDateStr}
        viewMode="day"
        saveStatus={saveStatus}
      />

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
                variants={sectionStaggerParent}
                initial={reduceMotion ? false : "hidden"}
                animate={reduceMotion ? undefined : "show"}
              >
                {!dayData ? (
                  <HomePageSkeleton />
                ) : (
                  <>
                    <motion.div variants={sectionStaggerChild}>
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
                    </motion.div>
                    <motion.div variants={sectionStaggerChild}>
                      <TaskList
                        title="Today's tasks"
                        tasks={allTasks}
                        sourceDateStr={selectedDateStr}
                        onMoveTask={handleMoveTask}
                        onChange={(tasks) =>
                          handleDataChange({
                            ...dayData,
                            ...partitionDayTasks(tasks, dayData),
                          })
                        }
                        accentColor="primary"
                      />
                    </motion.div>
                    <motion.div variants={sectionStaggerChild}>
                      <GratitudeSection
                        items={dayData.gratitude}
                        onChange={(items) => handleDataChange({ ...dayData, gratitude: items })}
                      />
                    </motion.div>
                    <motion.div variants={sectionStaggerChild}>
                      <BrainDump
                        text={dayData.brainDump}
                        onChange={(text) => handleDataChange({ ...dayData, brainDump: text })}
                      />
                    </motion.div>
                    <motion.div variants={sectionStaggerChild}>
                      <HabitsSection
                        habits={habits}
                        logs={dayData.habitLogs ?? {}}
                        onChange={(habitLogs) =>
                          handleDataChange({ ...dayData, habitLogs })
                        }
                      />
                    </motion.div>
                  </>
                )}
              </motion.div>
            </motion.div>

            <AnimatePresence initial={false}>
              {scheduleVisible && dayData && (
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
                      "max-lg:h-auto max-lg:shrink-0 max-lg:py-4 max-lg:!w-full",
                      "lg:order-none lg:h-full lg:min-h-0 lg:max-w-[70vw] lg:shrink-0 lg:overflow-hidden lg:border-l lg:border-t-0 lg:py-3",
                    )}
                  >
                  <div className="min-h-0 flex-1 overflow-hidden lg:px-1">
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
    </motion.div>
  );
}
