import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Palette, Download, Upload, Trash2, Zap, Clock } from "lucide-react";
import { themes } from "@/lib/themes";
import {
  clearAllData,
  getPlannerData,
  savePlannerData,
  loadDemoData,
  getScheduleRange,
  saveScheduleRange,
} from "@/lib/storage";
import { OUTLOOK_DEFAULT_DAY_RANGE } from "@/lib/schedule";
import { allDayGridMinutes, formatScheduleTime } from "@/lib/schedule";

interface SettingsPanelProps {
  trigger: React.ReactNode;
  onDataReset: () => void;
  selectedDateStr: string;
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export function SettingsPanel({
  trigger,
  onDataReset,
  selectedDateStr,
  currentTheme,
  onThemeChange,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [calStart, setCalStart] = useState(OUTLOOK_DEFAULT_DAY_RANGE.startMin);
  const [calEnd, setCalEnd] = useState(OUTLOOK_DEFAULT_DAY_RANGE.endMin);

  const gridMarks = useMemo(() => allDayGridMinutes(), []);

  const endMarkOptions = useMemo(
    () => gridMarks.filter((m) => m > calStart + 30),
    [gridMarks, calStart],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      const r = getScheduleRange();
      setCalStart(r.startMin);
      setCalEnd(r.endMin);
    }
  };

  const handleSaveCalendarHours = () => {
    if (calEnd <= calStart + 30) {
      alert("End time must be at least 30 minutes after start time.");
      return;
    }
    saveScheduleRange(
      { startMin: calStart, endMin: calEnd },
      { normalizePlannerData: true },
    );
    onDataReset();
    setOpen(false);
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to delete all planner data? This cannot be undone.")) {
      clearAllData();
      onDataReset();
    }
  };

  const handleLoadDemo = () => {
    loadDemoData(selectedDateStr);
    onDataReset();
  };

  const handleExport = () => {
    const data = getPlannerData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planner-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.days) {
          savePlannerData(json);
          onDataReset();
          alert("Data imported successfully!");
        } else {
          alert("Invalid backup file format.");
        }
      } catch {
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-serif text-2xl flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Settings
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-8">
          {/* Themes */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme
            </h3>
            <div className="flex flex-col gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  data-testid={`settings-theme-${theme.id}`}
                  onClick={() => onThemeChange(theme.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                  style={{
                    borderColor:
                      currentTheme === theme.id
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                    background:
                      currentTheme === theme.id
                        ? "hsl(var(--accent))"
                        : "transparent",
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-sm font-medium text-foreground">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          {/* Calendar day range */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Calendar hours
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Default matches Microsoft Outlook work time (8:00 AM – 5:00 PM). The
              schedule grid and new meetings stay within this window; saving will
              clip existing meetings that fall outside.
            </p>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cal-start">Day starts</Label>
                <Select
                  value={String(calStart)}
                  onValueChange={(v) => {
                    const next = Number(v);
                    setCalStart(next);
                    if (calEnd <= next + 30) {
                      const firstEnd = gridMarks.find((m) => m > next + 30);
                      if (firstEnd !== undefined) setCalEnd(firstEnd);
                    }
                  }}
                >
                  <SelectTrigger id="cal-start">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {gridMarks.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {formatScheduleTime(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cal-end">Day ends</Label>
                <Select value={String(calEnd)} onValueChange={(v) => setCalEnd(Number(v))}>
                  <SelectTrigger id="cal-end">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {endMarkOptions.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {formatScheduleTime(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 text-sm"
                  onClick={() => {
                    setCalStart(OUTLOOK_DEFAULT_DAY_RANGE.startMin);
                    setCalEnd(OUTLOOK_DEFAULT_DAY_RANGE.endMin);
                  }}
                >
                  Use Outlook defaults (8–5)
                </Button>
                <Button
                  type="button"
                  className="flex-1 text-sm"
                  onClick={handleSaveCalendarHours}
                  data-testid="button-save-calendar-hours"
                >
                  Save calendar hours
                </Button>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Data Management */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Data Management
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Backup (JSON)
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  data-testid="input-import"
                />
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Backup
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full justify-start text-sm"
                onClick={handleLoadDemo}
                data-testid="button-load-demo"
              >
                <Zap className="w-4 h-4 mr-2" />
                Load Demo Data
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start text-sm mt-4"
                onClick={handleClearData}
                data-testid="button-clear-data"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-2">
                All data is stored locally in your browser.
              </p>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
