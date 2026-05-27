import { useState } from "react";
import { Download, Upload, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import {
  buildPlannerBackup,
  clearPlannerData,
  importPlannerBackup,
  loadDemoData,
} from "@/lib/storage";

interface DataManagementSettingsProps {
  selectedDateStr: string;
  onDataReset: () => void;
}

export function DataManagementSettings({
  selectedDateStr,
  onDataReset,
}: DataManagementSettingsProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleClearPlannerData = () => {
    clearPlannerData();
    onDataReset();
    setClearDialogOpen(false);
    toast({
      title: "Planner data cleared",
      description: "Days, tasks, habits, and calendar hours were removed. Theme and Pomodoro settings were kept.",
    });
  };

  const handleLoadDemo = () => {
    const result = loadDemoData(selectedDateStr);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Could not load demo data",
        description: result.message,
      });
      return;
    }
    onDataReset();
    toast({
      title: "Demo data loaded",
      description:
        "30 days of sample tasks, habits, and calendar events are ready. Try Month view or Insights.",
    });
  };

  const handleExport = () => {
    const backup = buildPlannerBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
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
        const result = importPlannerBackup(json);
        if (result.ok) {
          onDataReset();
          toast({
            title: "Backup imported",
            description: "Your backup was restored from the file.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Import failed",
            description: result.message,
          });
        }
      } catch {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: "Could not read that file. Check that it is valid JSON.",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <section
      className="planner-card-surface rounded-xl border border-border p-5"
      data-testid="settings-data-section"
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Data management
      </h2>
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start text-sm"
          onClick={handleExport}
          data-testid="button-export"
        >
          <Download className="mr-2 h-4 w-4" />
          Export backup (JSON)
        </Button>

        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            data-testid="input-import"
          />
          <Button variant="outline" className="w-full justify-start text-sm" type="button">
            <Upload className="mr-2 h-4 w-4" />
            Import backup
          </Button>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start text-sm"
          onClick={handleLoadDemo}
          data-testid="button-load-demo"
        >
          <Zap className="mr-2 h-4 w-4" />
          Load demo data
        </Button>

        <Button
          variant="destructive"
          className="mt-2 w-full justify-start text-sm"
          onClick={() => setClearDialogOpen(true)}
          data-testid="button-clear-planner-data"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear planner data
        </Button>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Export includes all days, tasks, habits, calendar hours, theme, layout, and Pomodoro
          settings. Clearing planner data keeps theme and Pomodoro preferences.
        </p>
      </div>

      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Clear planner data?"
        description="This removes all days, tasks, habits, and saved calendar hours from this browser. Your theme, color mode, Pomodoro settings, and layout preferences will stay."
        confirmLabel="Clear planner data"
        destructive
        onConfirm={handleClearPlannerData}
      />
    </section>
  );
}
