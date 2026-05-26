import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMonthViewPrefs,
  saveMonthViewPrefs,
  type MonthViewPrefs,
} from "@/lib/month-prefs";

interface MonthViewContextValue {
  importantOnly: boolean;
  /** `null` = no filter, all categories visible. `[]` = explicitly nothing. */
  selectedCategoryIds: string[] | null;
  hasActiveFilter: boolean;
  isCategoryVisible: (id: string) => boolean;
  setImportantOnly: (value: boolean) => void;
  toggleImportantOnly: () => void;
  setSelectedCategoryIds: (ids: string[] | null) => void;
  /**
   * Toggle a single category. Collapses back to `null` (no filter) if the
   * resulting selection covers every known category.
   */
  toggleCategoryId: (id: string, allIds: string[]) => void;
  resetFilters: () => void;
}

const MonthViewContext = createContext<MonthViewContextValue | undefined>(undefined);

export function MonthViewProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<MonthViewPrefs>(() => getMonthViewPrefs());

  const persist = useCallback(
    (updater: (p: MonthViewPrefs) => MonthViewPrefs) => {
      setPrefs((prev) => {
        const next = updater(prev);
        saveMonthViewPrefs(next);
        return next;
      });
    },
    [],
  );

  const setImportantOnly = useCallback(
    (value: boolean) => {
      persist((p) => ({ ...p, importantOnly: value }));
    },
    [persist],
  );

  const toggleImportantOnly = useCallback(() => {
    persist((p) => ({ ...p, importantOnly: !p.importantOnly }));
  }, [persist]);

  const setSelectedCategoryIds = useCallback(
    (ids: string[] | null) => {
      persist((p) => ({ ...p, selectedCategoryIds: ids }));
    },
    [persist],
  );

  const toggleCategoryId = useCallback(
    (id: string, allIds: string[]) => {
      persist((p) => {
        const current = p.selectedCategoryIds;
        let nextSet: Set<string>;
        if (current === null) {
          // Currently "all" — flip the toggled one off.
          nextSet = new Set(allIds.filter((x) => x !== id));
        } else {
          nextSet = new Set(current);
          if (nextSet.has(id)) nextSet.delete(id);
          else nextSet.add(id);
        }
        if (allIds.length > 0 && allIds.every((x) => nextSet.has(x))) {
          return { ...p, selectedCategoryIds: null };
        }
        return { ...p, selectedCategoryIds: Array.from(nextSet) };
      });
    },
    [persist],
  );

  const resetFilters = useCallback(() => {
    persist(() => ({ importantOnly: false, selectedCategoryIds: null }));
  }, [persist]);

  const hasActiveFilter =
    prefs.importantOnly || prefs.selectedCategoryIds !== null;

  const isCategoryVisible = useCallback(
    (id: string) => {
      if (prefs.selectedCategoryIds === null) return true;
      return prefs.selectedCategoryIds.includes(id);
    },
    [prefs.selectedCategoryIds],
  );

  const value = useMemo<MonthViewContextValue>(
    () => ({
      importantOnly: prefs.importantOnly,
      selectedCategoryIds: prefs.selectedCategoryIds,
      hasActiveFilter,
      isCategoryVisible,
      setImportantOnly,
      toggleImportantOnly,
      setSelectedCategoryIds,
      toggleCategoryId,
      resetFilters,
    }),
    [
      prefs.importantOnly,
      prefs.selectedCategoryIds,
      hasActiveFilter,
      isCategoryVisible,
      setImportantOnly,
      toggleImportantOnly,
      setSelectedCategoryIds,
      toggleCategoryId,
      resetFilters,
    ],
  );

  return (
    <MonthViewContext.Provider value={value}>
      {children}
    </MonthViewContext.Provider>
  );
}

export function useMonthView(): MonthViewContextValue {
  const ctx = useContext(MonthViewContext);
  if (!ctx) {
    throw new Error("useMonthView must be used inside MonthViewProvider");
  }
  return ctx;
}
