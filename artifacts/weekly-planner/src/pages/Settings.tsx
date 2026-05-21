import { useState } from "react";
import { SettingsLayout } from "@/components/SettingsLayout";
import { ColorModeSettings } from "@/components/ColorModeSettings";
import { ThemeSettings } from "@/components/ThemeSettings";
import { CalendarHoursSettings } from "@/components/CalendarHoursSettings";
import { HabitsSettings } from "@/components/HabitsSettings";
import { DataManagementSettings } from "@/components/DataManagementSettings";
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
      <div className="planner-card-surface rounded-xl border border-border p-5">
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
