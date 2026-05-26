import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getSelectedDate, saveSelectedDate } from "@/lib/storage";
import { getEvents } from "@/lib/events";
import { toast } from "@/hooks/use-toast";
import { PlannerHeader } from "@/components/PlannerHeader";
import { MonthNavBar } from "@/components/month/MonthNavBar";
import { MonthCalendarGrid } from "@/components/month/MonthCalendarGrid";
import { MonthViewProvider } from "@/components/month/MonthViewProvider";
import { EventDialog, type EventDialogConfig } from "@/components/EventDialog";

export default function MonthPage() {
  const [location] = useLocation();
  const [anchorDateStr, setAnchorDateStr] = useState(() => getSelectedDate());
  const [dataVersion, setDataVersion] = useState(0);
  const [eventDialogConfig, setEventDialogConfig] =
    useState<EventDialogConfig | null>(null);

  const loadData = () => {
    setDataVersion((v) => v + 1);
  };

  const handleRequestCreate = (dateStr: string) => {
    setEventDialogConfig({
      mode: "create",
      defaultDateStr: dateStr,
      source: "month-cell",
    });
  };

  const handleRequestEdit = (eventId: string) => {
    const event = getEvents().find((e) => e.id === eventId);
    if (!event) {
      toast({
        title: "Could not open",
        description: "That event no longer exists.",
        variant: "destructive",
      });
      loadData();
      return;
    }
    setEventDialogConfig({ mode: "edit", event });
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

  return (
    <MonthViewProvider>
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

        <MonthNavBar
          anchorDateStr={anchorDateStr}
          onAnchorChange={setAnchorDateStr}
          dataVersion={dataVersion}
        />

        <main
          id="main-content"
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <MonthCalendarGrid
            anchorDateStr={anchorDateStr}
            dataVersion={dataVersion}
            onRequestCreate={handleRequestCreate}
            onRequestEdit={handleRequestEdit}
          />
        </main>
        <EventDialog
          config={eventDialogConfig}
          onClose={() => setEventDialogConfig(null)}
          onSaved={loadData}
        />
      </motion.div>
    </MonthViewProvider>
  );
}
