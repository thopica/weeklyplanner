import { Monitor, Moon, Sun } from "lucide-react";
import type { ColorMode } from "@/lib/appearance";
import { cn } from "@/lib/utils";

const MODES: {
  id: ColorMode;
  label: string;
  icon: typeof Sun;
}[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

interface ColorModeSettingsProps {
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
}

export function ColorModeSettings({
  colorMode,
  onColorModeChange,
}: ColorModeSettingsProps) {
  return (
    <section
      className="planner-card-surface rounded-xl border border-border p-5"
      data-testid="settings-color-mode-section"
    >
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Appearance
      </h2>
      <p className="type-section-desc mb-4">
        Dark mode applies to your selected color theme.
      </p>
      <div
        role="radiogroup"
        aria-label="Color mode"
        className="flex h-9 items-center rounded-lg border border-border bg-background p-0.5"
      >
        {MODES.map(({ id, label, icon: Icon }) => {
          const selected = colorMode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`settings-color-mode-${id}`}
              onClick={() => onColorModeChange(id)}
              className={cn(
                "type-caption flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
