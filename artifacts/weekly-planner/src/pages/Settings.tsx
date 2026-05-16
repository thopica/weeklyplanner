import { useState } from "react";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ColorModeSettings } from "@/components/ColorModeSettings";
import { ThemeSettings } from "@/components/ThemeSettings";
import { CalendarHoursSettings } from "@/components/CalendarHoursSettings";
import { HabitsSettings } from "@/components/HabitsSettings";
import { DataManagementSettings } from "@/components/DataManagementSettings";
import { PomodoroSettings } from "@/components/PomodoroSettings";
import type { ColorMode } from "@/lib/appearance";
import {
  getColorMode,
  getSelectedDate,
  getTheme,
  saveColorMode,
  saveTheme,
} from "@/lib/storage";

export default function SettingsPage() {
  const [selectedDateStr, setSelectedDateStr] = useState(() => getSelectedDate());
  const [currentTheme, setCurrentTheme] = useState(() => getTheme());
  const [colorMode, setColorMode] = useState<ColorMode>(() => getColorMode());
  const [refreshKey, setRefreshKey] = useState(0);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    saveTheme(themeId);
  };

  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    saveColorMode(mode);
  };

  const handleDataReset = () => {
    setSelectedDateStr(getSelectedDate());
    setRefreshKey((k) => k + 1);
  };

  return (
    <SettingsLayout>
      <ColorModeSettings colorMode={colorMode} onColorModeChange={handleColorModeChange} />
      <ThemeSettings currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      <CalendarHoursSettings key={`cal-${refreshKey}`} onSaved={handleDataReset} />
      <PomodoroSettings key={`pomodoro-${refreshKey}`} />
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
