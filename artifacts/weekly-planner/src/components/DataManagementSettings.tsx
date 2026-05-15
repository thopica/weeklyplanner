import { Download, Upload, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearAllData,
  getPlannerData,
  savePlannerData,
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
    e.target.value = "";
  };

  return (
    <section
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
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
          onClick={handleClearData}
          data-testid="button-clear-data"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear all data
        </Button>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          All data is stored locally in your browser.
        </p>
      </div>
    </section>
  );
}
