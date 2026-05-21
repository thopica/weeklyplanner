import { Palette } from "lucide-react";
import { themes } from "@/lib/themes";

interface ThemeSettingsProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export function ThemeSettings({ currentTheme, onThemeChange }: ThemeSettingsProps) {
  return (
    <section
      className="planner-card-surface rounded-xl border border-border p-5"
      data-testid="settings-theme-section"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Palette className="h-4 w-4" />
        Theme
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            data-testid={`settings-theme-${theme.id}`}
            onClick={() => onThemeChange(theme.id)}
            className="flex items-center gap-3 rounded-xl border p-3 transition-all"
            style={{
              borderColor:
                currentTheme === theme.id ? "hsl(var(--primary))" : "hsl(var(--border))",
              background:
                currentTheme === theme.id ? "hsl(var(--accent))" : "transparent",
            }}
          >
            <div
              className="h-6 w-6 shrink-0 rounded-full shadow-sm"
              style={{ backgroundColor: theme.color }}
            />
            <span className="text-sm font-medium text-foreground">{theme.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
