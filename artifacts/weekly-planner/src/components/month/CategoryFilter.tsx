import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, Filter, Settings as SettingsIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getCategories } from "@/lib/categories";
import { paletteFor } from "@/lib/palette";
import { useMonthView } from "@/components/month/MonthViewProvider";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  /** Bumped by the parent on data changes so the category list re-reads. */
  dataVersion: number;
}

export function CategoryFilter({ dataVersion }: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const categories = useMemo(() => getCategories(), [dataVersion]);
  const allIds = useMemo(() => categories.map((c) => c.id), [categories]);

  const {
    selectedCategoryIds,
    isCategoryVisible,
    toggleCategoryId,
    setSelectedCategoryIds,
  } = useMonthView();

  const filtered = selectedCategoryIds !== null;
  const visibleCount = filtered ? selectedCategoryIds!.length : categories.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filter categories"
          aria-pressed={filtered}
          data-testid="button-category-filter"
          className={cn(
            "type-label flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 transition-colors hover:bg-accent",
            filtered ? "bg-surface-accent text-foreground" : "text-muted-foreground",
          )}
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={2} />
          <span>Categories</span>
          {filtered ? (
            <span
              aria-label={`${visibleCount} of ${categories.length} visible`}
              className="type-meta rounded bg-foreground/10 px-1 tabular-nums text-foreground"
            >
              {visibleCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <span className="type-label text-muted-foreground">Show</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryIds(null)}
              className="type-meta rounded px-1.5 py-0.5 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryIds([])}
              className="type-meta rounded px-1.5 py-0.5 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            >
              None
            </button>
          </div>
        </div>
        <ul className="flex flex-col gap-0.5" role="listbox">
          {categories.map((cat) => {
            const palette = paletteFor(cat.colorKey);
            const visible = isCategoryVisible(cat.id);
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  role="option"
                  aria-pressed={visible}
                  aria-selected={visible}
                  onClick={() => toggleCategoryId(cat.id, allIds)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-accent"
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: palette.dot }}
                  />
                  <span className="type-ui min-w-0 flex-1 truncate text-foreground">
                    {cat.label}
                  </span>
                  {visible ? (
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-foreground"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <span aria-hidden className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-1.5 border-t border-border pt-1.5">
          <Link
            href="/settings#categories"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            data-testid="link-manage-categories"
          >
            <SettingsIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="type-ui">Manage categories</span>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
