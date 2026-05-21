import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getSelectedDate, saveSelectedDate } from "@/lib/storage";
import { PlannerHeader } from "@/components/PlannerHeader";
import { MonthNavBar } from "@/components/month/MonthNavBar";
import { MonthCalendarGrid } from "@/components/month/MonthCalendarGrid";

export default function MonthPage() {
  const [location, navigate] = useLocation();
  const [anchorDateStr, setAnchorDateStr] = useState(() => getSelectedDate());
  const [dataVersion, setDataVersion] = useState(0);

  const loadData = () => {
    setDataVersion((v) => v + 1);
  };

  useEffect(() => {
    saveSelectedDate(anchorDateStr);
    loadData();
  }, [anchorDateStr]);

  useEffect(() => {
    if (location === "/month") {
      setAnchorDateStr(getSelectedDate());
      loadData();
    }
  }, [location]);

  useEffect(() => {
    if (location !== "/month") return;
    const refresh = () => {
      setAnchorDateStr(getSelectedDate());
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
      data-testid="month-view-root"
    >
      <a
        href="#main-content"
        className="absolute left-3 top-0 z-100 -translate-y-20 rounded-lg bg-foreground px-4 py-2.5 type-ui font-medium text-background shadow-lg transition focus:translate-y-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to month
      </a>

      <PlannerHeader
        selectedDateStr={anchorDateStr}
        onSelectedDateChange={setAnchorDateStr}
        viewMode="month"
      />

      <MonthNavBar anchorDateStr={anchorDateStr} onAnchorChange={setAnchorDateStr} />

      <main
        id="main-content"
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <MonthCalendarGrid
          key={dataVersion}
          anchorDateStr={anchorDateStr}
          onOpenDay={openDay}
        />
      </main>
    </motion.div>
  );
}
