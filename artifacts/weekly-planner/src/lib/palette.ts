import type { ColorKey } from "./types";

export interface PaletteEntry {
  /** Saturated swatch color for legend dots, color pickers, focus rings. */
  dot: string;
  /** Soft tinted surface used as event-pill background. */
  bg: string;
  /** Readable foreground tuned for AA contrast on `bg`. */
  text: string;
}

/**
 * Category identity colors.
 *
 * Hard-coded by design — these are recognizable user identifiers, not theme tokens.
 * Defaults (pink/green/blue/amber/purple) ship with the five seeded categories.
 * The remaining four (teal/coral/gray/red) are reserved for user-created categories.
 */
export const PALETTE: Record<ColorKey, PaletteEntry> = {
  pink: { dot: "#D4537E", bg: "#FBEAF0", text: "#72243E" },
  green: { dot: "#1D9E75", bg: "#E1F5EE", text: "#085041" },
  blue: { dot: "#378ADD", bg: "#E6F1FB", text: "#0C447C" },
  amber: { dot: "#EF9F27", bg: "#FAEEDA", text: "#633806" },
  purple: { dot: "#7F77DD", bg: "#EEEDFE", text: "#3C3489" },
  teal: { dot: "#1D9E75", bg: "#E1F5EE", text: "#085041" },
  coral: { dot: "#D85A30", bg: "#FAECE7", text: "#712B13" },
  gray: { dot: "#888780", bg: "#F1EFE8", text: "#444441" },
  red: { dot: "#E24B4A", bg: "#FCEBEB", text: "#791F1F" },
};

export const ALL_COLOR_KEYS: ColorKey[] = [
  "pink",
  "green",
  "blue",
  "amber",
  "purple",
  "teal",
  "coral",
  "gray",
  "red",
];

/** Colors not used by seed categories — surfaced first in the custom-category color picker. */
export const CUSTOM_COLOR_KEYS: ColorKey[] = ["teal", "coral", "gray", "red"];

export function paletteFor(colorKey: ColorKey): PaletteEntry {
  return PALETTE[colorKey] ?? PALETTE.gray;
}

export function isColorKey(value: unknown): value is ColorKey {
  return typeof value === "string" && value in PALETTE;
}
