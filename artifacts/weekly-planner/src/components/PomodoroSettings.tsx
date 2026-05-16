import { useState } from "react";
import { Check, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getPomodoroSettings, savePomodoroSettings } from "@/lib/storage";
import {
  DEFAULT_POMODORO_SETTINGS,
  normalizePomodoroSettings,
  type PomodoroSettings,
} from "@/lib/pomodoro";
import { cn } from "@/lib/utils";

type StatusNotice = { message: string };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function MinuteField({
  id,
  label,
  value,
  onChange,
  max = 90,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (minutes: number) => void;
  max?: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={String(value)}
        onChange={(e) => {
          const raw = digitsOnly(e.target.value);
          if (!raw) {
            onChange(1);
            return;
          }
          const n = Math.min(max, Math.max(1, Number(raw)));
          onChange(n);
        }}
        data-testid={id}
        className="tabular-nums"
      />
    </div>
  );
}

export function PomodoroSettings() {
  const [persisted, setPersisted] = useState(() => getPomodoroSettings());
  const [draft, setDraft] = useState<PomodoroSettings>(() => getPomodoroSettings());
  const [status, setStatus] = useState<StatusNotice | null>(null);
  const [savePressed, setSavePressed] = useState(false);

  const hasUnsavedChanges =
    draft.focusMinutes !== persisted.focusMinutes ||
    draft.shortBreakMinutes !== persisted.shortBreakMinutes ||
    draft.longBreakMinutes !== persisted.longBreakMinutes ||
    draft.sessionsBeforeLong !== persisted.sessionsBeforeLong ||
    draft.soundEnabled !== persisted.soundEnabled;

  const showStatus = (notice: StatusNotice) => {
    setStatus(notice);
    window.setTimeout(() => setStatus(null), 2800);
  };

  const updateDraft = (patch: Partial<PomodoroSettings>) => {
    setDraft((prev) => normalizePomodoroSettings({ ...prev, ...patch }));
    setSavePressed(false);
  };

  const handleSave = () => {
    const next = normalizePomodoroSettings(draft);
    savePomodoroSettings(next);
    setPersisted(next);
    setDraft(next);
    setSavePressed(true);
    showStatus({ message: "Pomodoro settings saved." });
    window.setTimeout(() => setSavePressed(false), 2000);
  };

  const handleReset = () => {
    const next = { ...DEFAULT_POMODORO_SETTINGS };
    savePomodoroSettings(next);
    setPersisted(next);
    setDraft(next);
    setSavePressed(true);
    showStatus({ message: "Reset to classic Pomodoro defaults." });
    window.setTimeout(() => setSavePressed(false), 2000);
  };

  return (
    <section
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
      data-testid="settings-pomodoro-section"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Timer className="h-4 w-4" />
        Pomodoro timer
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Saved defaults for focus and breaks. Tap the tomato in the header to open the timer;
        tap the countdown on the Pomodoro screen to adjust times for this session only.
      </p>

      <motionFields draft={draft} hasUnsavedChanges={hasUnsavedChanges} updateDraft={updateDraft} />

      <div className="mt-4 space-y-3">
        {hasUnsavedChanges && (
          <p className="text-center text-xs font-medium text-primary" role="status">
            Unsaved changes — press Save to apply.
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="secondary" className="flex-1 text-sm" onClick={handleReset}>
            Reset to 25 / 5 / 15
          </Button>
          <Button
            type="button"
            className={cn(
              "flex-1 text-sm",
              hasUnsavedChanges && "ring-2 ring-primary/40 ring-offset-2 ring-offset-card",
              savePressed && "bg-secondary text-secondary-foreground",
            )}
            onClick={handleSave}
            disabled={!hasUnsavedChanges && !savePressed}
            data-testid="button-save-pomodoro-settings"
          >
            {savePressed ? (
              <>
                <Check className="mr-2 h-4 w-4" aria-hidden />
                Saved
              </>
            ) : (
              "Save Pomodoro settings"
            )}
          </Button>
        </div>

        {status && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-lg border border-secondary/40 bg-secondary/10 px-3 py-2.5 text-center text-sm font-medium text-secondary"
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {status.message}
          </div>
        )}
      </div>
    </section>
  );
}

function motionFields({
  draft,
  hasUnsavedChanges,
  updateDraft,
}: {
  draft: PomodoroSettings;
  hasUnsavedChanges: boolean;
  updateDraft: (patch: Partial<PomodoroSettings>) => void;
}) {
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "grid gap-4 rounded-lg border border-transparent p-1 transition-colors sm:grid-cols-2",
          hasUnsavedChanges && "border-primary/25 bg-primary/5",
        )}
      >
        <MinuteField
          id="pomodoro-focus"
          label="Focus (minutes)"
          value={draft.focusMinutes}
          onChange={(v) => updateDraft({ focusMinutes: v })}
        />
        <MinuteField
          id="pomodoro-short"
          label="Short break (minutes)"
          value={draft.shortBreakMinutes}
          onChange={(v) => updateDraft({ shortBreakMinutes: v })}
        />
        <MinuteField
          id="pomodoro-long"
          label="Long break (minutes)"
          value={draft.longBreakMinutes}
          onChange={(v) => updateDraft({ longBreakMinutes: v })}
        />
        <MinuteField
          id="pomodoro-sessions"
          label="Sessions before long break"
          value={draft.sessionsBeforeLong}
          onChange={(v) => updateDraft({ sessionsBeforeLong: v })}
          max={8}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-3">
        <motionSoundLabel />
        <Switch
          id="pomodoro-sound"
          checked={draft.soundEnabled}
          onCheckedChange={(checked) => updateDraft({ soundEnabled: checked })}
          data-testid="switch-pomodoro-sound"
        />
      </div>
    </div>
  );
}

function motionSoundLabel() {
  return (
    <div>
      <Label htmlFor="pomodoro-sound" className="text-sm font-medium">
        Sound on phase complete
      </Label>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Short chime when focus or break ends
      </p>
    </div>
  );
}
