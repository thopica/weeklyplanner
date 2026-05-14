import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, Palette, Download, Upload, Trash2, Zap } from "lucide-react";
import { themes } from "@/lib/themes";
import { clearAllData, getPlannerData, savePlannerData, loadDemoData } from "@/lib/storage";

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
    <Sheet>
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
