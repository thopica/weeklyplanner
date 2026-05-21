import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  getSelectedDate,
  saveSelectedDate,
  getScheduleRange,
} from "@/lib/storage";
import { PlannerHeader } from "@/components/PlannerHeader";
import { WorkweekBoard } from "@/components/workweek/WorkweekBoard";
import { WeekNavBar } from "@/components/workweek/WeekNavBar";

export default function WeekPage() {
  const [location, navigate] = useLocation();
  const [selectedDateStr, setSelectedDateStr] = useState(() => getSelectedDate());
  const [scheduleRange, setScheduleRange] = useState(() => getScheduleRange());
  const [dataVersion, setDataVersion] = useState(0);

  const loadData = () => {
    setScheduleRange(getScheduleRange());
    setDataVersion((v) => v + 1);
  };

  useEffect(() => {
    saveSelectedDate(selectedDateStr);
    loadData();
  }, [selectedDateStr]);

  useEffect(() => {
    if (location === "/week") {
      setSelectedDateStr(getSelectedDate());
      loadData();
    }
  }, [location]);

  useEffect(() => {
    if (location !== "/week") return;
    const refresh = () => {
      setSelectedDateStr(getSelectedDate());
      loadData();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [location]);

  const openDay = (dateStr: string) => {
    saveSelectedDate(dateStr);
    navigate("/");
  };

  return (
    <motion.div
      className="planner-canvas relative isolate flex h-dvh max-h-dvh min-h-dvh flex-col overflow-hidden bg-canvas"
      data-testid="week-view-root"
    >
      <a
        href="#main-content"
        className="absolute left-3 top-0 z-100 -translate-y-20 rounded-lg bg-foreground px-4 py-2.5 type-ui font-medium text-background shadow-lg transition focus:translate-y-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to week
      </a>

      <PlannerHeader
        selectedDateStr={selectedDateStr}
        onSelectedDateChange={setSelectedDateStr}
        viewMode="week"
      />

      <WeekNavBar
        selectedDate={parseISO(`${selectedDateStr}T12:00:00`)}
        onAnchorChange={setSelectedDateStr}
      />

      <main id="main-content" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <WorkweekBoard
          key={dataVersion}
          anchorDateStr={selectedDateStr}
          range={scheduleRange}
          onOpenDay={openDay}
        />
      </main>
    </motion.div>
  );
}
