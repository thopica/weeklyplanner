import { themes } from "@/lib/themes";

export type ColorMode = "light" | "dark" | "system";

export const THEME_CLASS_NAMES = themes.map((t) => t.id);

export function isDarkModeResolved(mode: ColorMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyAppearance(themeId: string, colorMode: ColorMode): void {
  const root = document.documentElement;
  for (const id of THEME_CLASS_NAMES) {
    root.classList.remove(id);
  }
  root.classList.remove("dark");
  root.classList.add(themeId);
  if (isDarkModeResolved(colorMode)) {
    root.classList.add("dark");
  }
}

export function watchSystemColorMode(
  getThemeId: () => string,
  getColorMode: () => ColorMode,
): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getColorMode() === "system") {
      applyAppearance(getThemeId(), "system");
    }
  };
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
