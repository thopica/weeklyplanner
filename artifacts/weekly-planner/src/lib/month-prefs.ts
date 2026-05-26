const STORAGE_KEY = "weeklyPlanner_monthViewPrefs";

export interface MonthViewPrefs {
  importantOnly: boolean;
  /**
   * `null` = "no filter — show every category"; an empty `[]` means the user
   * actively cleared every category and wants nothing shown. The provider
   * honors both states distinctly.
   */
  selectedCategoryIds: string[] | null;
}

const DEFAULTS: MonthViewPrefs = {
  importantOnly: false,
  selectedCategoryIds: null,
};

function normalize(raw: unknown): MonthViewPrefs {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULTS };
  const p = raw as Partial<MonthViewPrefs>;
  const importantOnly = typeof p.importantOnly === "boolean" ? p.importantOnly : false;
  let selectedCategoryIds: string[] | null;
  if (p.selectedCategoryIds === null) {
    selectedCategoryIds = null;
  } else if (Array.isArray(p.selectedCategoryIds)) {
    selectedCategoryIds = p.selectedCategoryIds.filter(
      (id): id is string => typeof id === "string",
    );
  } else {
    selectedCategoryIds = null;
  }
  return { importantOnly, selectedCategoryIds };
}

export function getMonthViewPrefs(): MonthViewPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return normalize(JSON.parse(raw));
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveMonthViewPrefs(prefs: MonthViewPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ergonomic, not load-bearing — swallow.
  }
}
