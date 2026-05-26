import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/categories";
import { reassignEventsCategory, getEvents } from "@/lib/events";
import {
  ALL_COLOR_KEYS,
  CUSTOM_COLOR_KEYS,
  paletteFor,
} from "@/lib/palette";
import {
  CategoryDefinition,
  ColorKey,
  MAX_CATEGORY_LABEL_LENGTH,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoriesSettingsProps {
  onCategoriesChange: () => void;
}

function buildCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of getEvents()) {
    counts.set(e.categoryId, (counts.get(e.categoryId) ?? 0) + 1);
  }
  return counts;
}

function formatCount(count: number): string {
  if (count === 0) return "No events";
  if (count === 1) return "1 event";
  return `${count} events`;
}

function defaultDraftColor(categories: CategoryDefinition[]): ColorKey {
  const used = new Set(categories.map((c) => c.colorKey));
  for (const key of CUSTOM_COLOR_KEYS) {
    if (!used.has(key)) return key;
  }
  return "teal";
}

interface DraftState {
  label: string;
  colorKey: ColorKey;
}

export function CategoriesSettings({ onCategoriesChange }: CategoriesSettingsProps) {
  const [categories, setCategories] = useState<CategoryDefinition[]>(() =>
    getCategories(),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<DraftState>(() => ({
    label: "",
    colorKey: defaultDraftColor(getCategories()),
  }));
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<CategoryDefinition | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string | null>(null);

  const counts = useMemo(() => buildCounts(), [categories]);
  const showForm = isAdding || editingId !== null;

  const refresh = () => {
    setCategories(getCategories());
    onCategoriesChange();
  };

  const resetForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setDraft({ label: "", colorKey: defaultDraftColor(getCategories()) });
    setError(null);
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setDraft({ label: "", colorKey: defaultDraftColor(categories) });
    setError(null);
  };

  const handleEdit = (cat: CategoryDefinition) => {
    setIsAdding(false);
    setEditingId(cat.id);
    setDraft({ label: cat.label, colorKey: cat.colorKey });
    setError(null);
  };

  const handleSave = () => {
    const label = draft.label.trim();
    if (!label) {
      setError("Label is required.");
      return;
    }
    if (label.length > MAX_CATEGORY_LABEL_LENGTH) {
      setError(`Label must be ${MAX_CATEGORY_LABEL_LENGTH} characters or fewer.`);
      return;
    }

    try {
      if (editingId) {
        updateCategory(editingId, { label, colorKey: draft.colorKey });
      } else {
        addCategory({ label, colorKey: draft.colorKey });
      }
    } catch (e) {
      console.error("Failed to save category", e);
      setError("Could not save. Try again.");
      return;
    }
    refresh();
    resetForm();
  };

  const handleDeleteClick = (cat: CategoryDefinition) => {
    if (categories.length <= 1) return;
    setPendingDelete(cat);
    const count = counts.get(cat.id) ?? 0;
    if (count > 0) {
      const safeTarget = categories.find((c) => c.id !== cat.id);
      setReassignTargetId(safeTarget?.id ?? null);
    } else {
      setReassignTargetId(null);
    }
  };

  const closeDeleteDialog = () => {
    setPendingDelete(null);
    setReassignTargetId(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const count = counts.get(pendingDelete.id) ?? 0;
    try {
      if (count > 0) {
        if (!reassignTargetId) return;
        reassignEventsCategory(pendingDelete.id, reassignTargetId);
      }
      deleteCategory(pendingDelete.id);
    } catch (e) {
      console.error("Failed to delete category", e);
      return;
    }
    if (editingId === pendingDelete.id) resetForm();
    refresh();
    closeDeleteDialog();
  };

  const swatchOrder: ColorKey[] = useMemo(() => {
    if (editingId) return ALL_COLOR_KEYS;
    return [
      ...CUSTOM_COLOR_KEYS,
      ...ALL_COLOR_KEYS.filter((c) => !CUSTOM_COLOR_KEYS.includes(c)),
    ];
  }, [editingId]);

  return (
    <section data-testid="categories-settings" id="categories">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Tag className="h-4 w-4" />
        Categories
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Categories tag every event with a color so the month view stays scannable.
        Rename, recolor, add, or delete to match how you actually plan — at least
        one category must remain. Events using a deleted category get moved to
        the category you pick before deleting.
      </p>

      <ul className="mb-4 space-y-2">
        {categories.map((cat) => {
          if (editingId === cat.id) return null;
          const palette = paletteFor(cat.colorKey);
          const count = counts.get(cat.id) ?? 0;
          return (
            <li
              key={cat.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
              data-testid={`category-settings-row-${cat.id}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: palette.dot }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {cat.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCount(count)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 sm:h-8 sm:w-8"
                  onClick={() => handleEdit(cat)}
                  aria-label={`Edit ${cat.label}`}
                  data-testid={`button-edit-category-${cat.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive hover:text-destructive disabled:text-muted-foreground sm:h-8 sm:w-8"
                  onClick={() => handleDeleteClick(cat)}
                  disabled={categories.length <= 1}
                  title={
                    categories.length <= 1
                      ? "At least one category must remain."
                      : undefined
                  }
                  aria-label={`Delete ${cat.label}`}
                  data-testid={`button-delete-category-${cat.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {showForm && (
        <div className="mb-4 space-y-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="grid gap-2">
            <Label htmlFor="category-label">Label</Label>
            <Input
              id="category-label"
              value={draft.label}
              onChange={(e) => {
                setDraft({ ...draft, label: e.target.value });
                setError(null);
              }}
              placeholder='e.g. "Travel"'
              maxLength={MAX_CATEGORY_LABEL_LENGTH}
              autoFocus
              data-testid="input-category-label"
            />
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <div
              role="radiogroup"
              aria-label="Category color"
              className="flex flex-wrap gap-2"
            >
              {swatchOrder.map((key) => {
                const palette = paletteFor(key);
                const selected = draft.colorKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Color ${key}`}
                    onClick={() => {
                      setDraft({ ...draft, colorKey: key });
                      setError(null);
                    }}
                    style={{ backgroundColor: palette.dot }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                      selected
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "ring-1 ring-border hover:ring-foreground/40",
                    )}
                    data-testid={`swatch-${key}`}
                  >
                    {selected ? (
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1 text-sm"
              onClick={handleSave}
              data-testid="button-save-category"
            >
              {editingId ? "Save changes" : "Add category"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 text-sm"
              onClick={resetForm}
              data-testid="button-cancel-category"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!showForm && (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-sm"
          onClick={handleStartAdd}
          data-testid="button-add-category"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      )}

      <DeleteCategoryDialog
        category={pendingDelete}
        count={pendingDelete ? counts.get(pendingDelete.id) ?? 0 : 0}
        categories={categories}
        reassignTargetId={reassignTargetId}
        setReassignTargetId={setReassignTargetId}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

interface DeleteCategoryDialogProps {
  category: CategoryDefinition | null;
  count: number;
  categories: CategoryDefinition[];
  reassignTargetId: string | null;
  setReassignTargetId: (id: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteCategoryDialog({
  category,
  count,
  categories,
  reassignTargetId,
  setReassignTargetId,
  onCancel,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const open = category !== null;
  const targetOptions = useMemo(
    () =>
      category
        ? [...categories]
            .filter((c) => c.id !== category.id)
            .sort((a, b) => a.order - b.order)
        : [],
    [categories, category],
  );

  const confirmDisabled = count > 0 && !reassignTargetId;
  const confirmLabel =
    count === 0
      ? "Delete"
      : count === 1
        ? "Delete & move 1 event"
        : `Delete & move ${count} events`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="max-w-sm gap-0 border-border p-6 shadow-tinted sm:rounded-xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="type-section-title">
            {category ? `Delete "${category.label}"?` : "Delete category?"}
          </DialogTitle>
          <DialogDescription className="type-ui">
            {count === 0
              ? "This category has no events. You can safely delete it."
              : `${count === 1 ? "1 event uses" : `${count} events use`} this category. Pick a category to move ${count === 1 ? "it" : "them"} to before deleting.`}
          </DialogDescription>
        </DialogHeader>

        {count > 0 && category ? (
          <div className="mt-4 grid gap-2">
            <Label htmlFor="reassign-target">Move events to</Label>
            <Select
              value={reassignTargetId ?? ""}
              onValueChange={(v) => setReassignTargetId(v)}
            >
              <SelectTrigger id="reassign-target" data-testid="select-reassign-target">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {targetOptions.map((cat) => {
                  const palette = paletteFor(cat.colorKey);
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: palette.dot }}
                        />
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={confirmDisabled}
            onClick={onConfirm}
            data-testid="button-confirm-delete-category"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
