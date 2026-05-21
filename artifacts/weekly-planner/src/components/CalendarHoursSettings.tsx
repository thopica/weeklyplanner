import { useMemo, useState } from "react";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getScheduleRange, saveScheduleRange } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import {
  OUTLOOK_DEFAULT_DAY_RANGE,
  allDayGridMinutes,
  formatScheduleTime,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface CalendarHoursSettingsProps {
  onSaved: () => void;
}

type StatusNotice = {
  message: string;
};

const WORKDAY_LABEL = "8:00 AM – 5:00 PM";

export function CalendarHoursSettings({ onSaved }: CalendarHoursSettingsProps) {
  const [persistedRange, setPersistedRange] = useState(() => getScheduleRange());
  const [calStart, setCalStart] = useState(persistedRange.startMin);
  const [calEnd, setCalEnd] = useState(persistedRange.endMin);
  const [status, setStatus] = useState<StatusNotice | null>(null);
  const [savePressed, setSavePressed] = useState(false);

  const gridMarks = useMemo(() => allDayGridMinutes(), []);
  const endMarkOptions = useMemo(
    () => gridMarks.filter((m) => m > calStart + 30),
    [gridMarks, calStart],
  );

  const hasUnsavedChanges =
    calStart !== persistedRange.startMin || calEnd !== persistedRange.endMin;

  const showStatus = (notice: StatusNotice) => {
    setStatus(notice);
    window.setTimeout(() => setStatus(null), 2800);
  };

  const persistRange = (startMin: number, endMin: number, statusMessage: string) => {
    if (endMin <= startMin + 30) {
      toast({
        variant: "destructive",
        title: "Invalid calendar hours",
        description: "End time must be at least 30 minutes after start time.",
      });
      return;
    }
    const result = saveScheduleRange(
      { startMin, endMin },
      { normalizePlannerData: true },
    );
    if (!result.ok) {
      toast({
        title: "Could not save calendar hours",
        description: result.message,
        variant: "destructive",
      });
      return;
    }
    setPersistedRange({ startMin, endMin });
    setCalStart(startMin);
    setCalEnd(endMin);
    onSaved();
    setSavePressed(true);
    showStatus({ message: statusMessage });
    window.setTimeout(() => setSavePressed(false), 2000);
  };

  const handleResetToWorkday = () => {
    persistRange(
      OUTLOOK_DEFAULT_DAY_RANGE.startMin,
      OUTLOOK_DEFAULT_DAY_RANGE.endMin,
      `Reset to ${WORKDAY_LABEL} and saved.`,
    );
  };

  const handleSave = () => {
    persistRange(calStart, calEnd, "Calendar hours saved.");
  };

  return (
    <section
      className="planner-card-surface rounded-xl border border-border p-5"
      data-testid="settings-calendar-section"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Clock className="h-4 w-4" />
        Calendar hours
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Choose when your day schedule starts and ends. The grid and new time blocks stay within
        this window; saving will clip existing blocks that fall outside.
      </p>
      <div className="space-y-4">
        <div
          className={cn(
            "grid gap-2 rounded-lg border border-transparent p-1 transition-colors sm:grid-cols-2",
            hasUnsavedChanges && "border-primary/25 bg-primary/5",
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor="cal-start">Day starts</Label>
            <Select
              value={String(calStart)}
              onValueChange={(v) => {
                const next = Number(v);
                setCalStart(next);
                setSavePressed(false);
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
            <Select
              value={String(calEnd)}
              onValueChange={(v) => {
                setCalEnd(Number(v));
                setSavePressed(false);
              }}
            >
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
        </div>

        {hasUnsavedChanges && !status && (
          <p className="text-center text-xs font-medium text-primary" role="status">
            Unsaved changes — press Save calendar hours to apply.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "flex-1 text-sm transition-all",
              savePressed &&
                "border-secondary/50 bg-secondary/10 ring-2 ring-secondary/30 ring-offset-2 ring-offset-card",
            )}
            onClick={handleResetToWorkday}
            data-testid="button-reset-calendar-hours"
          >
            Reset to 8 AM – 5 PM
          </Button>
          <Button
            type="button"
            className={cn(
              "flex-1 text-sm transition-all",
              hasUnsavedChanges && "ring-2 ring-primary/40 ring-offset-2 ring-offset-card",
              savePressed && "bg-secondary text-secondary-foreground",
            )}
            onClick={handleSave}
            disabled={!hasUnsavedChanges && !savePressed}
            data-testid="button-save-calendar-hours"
          >
            {savePressed ? (
              <>
                <Check className="mr-2 h-4 w-4" aria-hidden />
                Saved
              </>
            ) : (
              "Save calendar hours"
            )}
          </Button>
        </div>

        {status && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-2.5 text-center text-sm font-medium text-secondary transition-colors"
            data-testid="calendar-hours-status"
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {status.message}
          </div>
        )}
      </div>
    </section>
  );
}
