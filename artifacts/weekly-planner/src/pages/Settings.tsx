import { useState } from "react";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ThemeSettings } from "@/components/ThemeSettings";
import { CalendarHoursSettings } from "@/components/CalendarHoursSettings";
import { HabitsSettings } from "@/components/HabitsSettings";
import { DataManagementSettings } from "@/components/DataManagementSettings";
import { getSelectedDate, getTheme, saveTheme } from "@/lib/storage";

export default function SettingsPage() {
  const [selectedDateStr] = useState(() => getSelectedDate());
  const [currentTheme, setCurrentTheme] = useState(() => getTheme());
  const [refreshKey, setRefreshKey] = useState(0);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    saveTheme(themeId);
  };

  const handleDataReset = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <SettingsLayout>
      <ThemeSettings currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      <CalendarHoursSettings key={`cal-${refreshKey}`} onSaved={handleDataReset} />
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <HabitsSettings onHabitsChange={handleDataReset} />
      </div>
      <DataManagementSettings
        key={`data-${refreshKey}`}
        selectedDateStr={selectedDateStr}
        onDataReset={handleDataReset}
      />
    </SettingsLayout>
  );
}
