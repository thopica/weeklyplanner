import {
  CategoryDefinition,
  ColorKey,
  FALLBACK_CATEGORY_ID,
  MAX_CATEGORY_LABEL_LENGTH,
} from "./types";
import { isColorKey } from "./palette";

const STORAGE_KEY = "weeklyPlanner_categories";
const DELETED_DEFAULTS_KEY = "weeklyPlanner_deletedDefaultCategories";

export const DEFAULT_CATEGORIES: readonly CategoryDefinition[] = [
  { id: "family", label: "Family", colorKey: "pink", isDefault: true, order: 0 },
  { id: "health", label: "Health", colorKey: "green", isDefault: true, order: 1 },
  { id: "work", label: "Work", colorKey: "blue", isDefault: true, order: 2 },
  { id: "social", label: "Social", colorKey: "amber", isDefault: true, order: 3 },
  { id: "personal", label: "Personal", colorKey: "purple", isDefault: true, order: 4 },
] as const;

function getDeletedDefaultIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_DEFAULTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch (e) {
    console.error("Failed to read deleted-defaults set", e);
    return new Set();
  }
}

function saveDeletedDefaultIds(ids: Set<string>): boolean {
  try {
    localStorage.setItem(DELETED_DEFAULTS_KEY, JSON.stringify([...ids]));
    return true;
  } catch (e) {
    console.error("Failed to save deleted-defaults set", e);
    return false;
  }
}

/**
 * Refresh the deleted-defaults set so it matches an imported categories list:
 * any default missing from the imported list is treated as user-deleted; any
 * default present is unmarked.
 */
export function reconcileDeletedDefaultsFromList(
  list: CategoryDefinition[],
): void {
  const presentDefaultIds = new Set(
    list.filter((c) => c.isDefault).map((c) => c.id),
  );
  const next = new Set<string>();
  for (const d of DEFAULT_CATEGORIES) {
    if (!presentDefaultIds.has(d.id)) next.add(d.id);
  }
  saveDeletedDefaultIds(next);
}

/** Wipe the deleted-defaults tombstones so all five seeds reappear on next read. */
export function clearDeletedDefaults(): void {
  try {
    localStorage.removeItem(DELETED_DEFAULTS_KEY);
  } catch (e) {
    console.error("Failed to clear deleted-defaults set", e);
  }
}

function cloneDefaults(): CategoryDefinition[] {
  return DEFAULT_CATEGORIES.map((c) => ({ ...c }));
}

function normalizeCategory(raw: unknown): CategoryDefinition | null {
  if (typeof raw !== "object" || raw === null) return null;
  const c = raw as Partial<CategoryDefinition>;
  if (typeof c.id !== "string" || !c.id.trim()) return null;
  if (typeof c.label !== "string") return null;
  if (!isColorKey(c.colorKey)) return null;
  return {
    id: c.id,
    label: c.label.slice(0, MAX_CATEGORY_LABEL_LENGTH),
    colorKey: c.colorKey,
    isDefault: Boolean(c.isDefault),
    order: typeof c.order === "number" && Number.isFinite(c.order) ? c.order : 0,
  };
}

function normalizeCategoryList(raw: unknown): CategoryDefinition[] | null {
  if (!Array.isArray(raw)) return null;
  const list = raw
    .map(normalizeCategory)
    .filter((c): c is CategoryDefinition => c !== null);
  return list.length > 0 ? list : null;
}

/** Persist categories list. Returns true on success. */
export function saveCategories(categories: CategoryDefinition[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    return true;
  } catch (e) {
    console.error("Failed to save categories", e);
    return false;
  }
}

/**
 * Read categories from storage. Seeds defaults on first read.
 *
 * Defaults that the user has explicitly deleted (tracked in
 * `weeklyPlanner_deletedDefaultCategories`) stay gone — they are NOT merged
 * back in. Defaults that have never been deleted self-heal if the stored
 * list lost them.
 */
export function getCategories(): CategoryDefinition[] {
  let stored: CategoryDefinition[] | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      stored = normalizeCategoryList(JSON.parse(raw));
    }
  } catch (e) {
    console.error("Failed to parse categories", e);
  }

  if (!stored) {
    const defaults = cloneDefaults();
    saveCategories(defaults);
    return defaults;
  }

  const deletedDefaults = getDeletedDefaultIds();

  const byId = new Map<string, CategoryDefinition>();
  for (const c of stored) byId.set(c.id, c);
  for (const d of DEFAULT_CATEGORIES) {
    if (byId.has(d.id)) continue;
    if (deletedDefaults.has(d.id)) continue;
    byId.set(d.id, { ...d });
  }

  const merged = Array.from(byId.values()).sort((a, b) => a.order - b.order);
  return merged;
}

export function getCategoryById(id: string): CategoryDefinition | undefined {
  return getCategories().find((c) => c.id === id);
}

export function getCategoryOrFallback(id: string): CategoryDefinition {
  const list = getCategories();
  const found = list.find((c) => c.id === id);
  if (found) return found;
  const fallback = list.find((c) => c.id === FALLBACK_CATEGORY_ID);
  return fallback ?? list[0];
}

function generateCategoryId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `cat-${crypto.randomUUID()}`
    : `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addCategory(input: {
  label: string;
  colorKey: ColorKey;
}): CategoryDefinition {
  const list = getCategories();
  const nextOrder = list.length === 0 ? 0 : Math.max(...list.map((c) => c.order)) + 1;
  const next: CategoryDefinition = {
    id: generateCategoryId(),
    label: input.label.slice(0, MAX_CATEGORY_LABEL_LENGTH),
    colorKey: input.colorKey,
    isDefault: false,
    order: nextOrder,
  };
  saveCategories([...list, next]);
  return next;
}

export function updateCategory(
  id: string,
  patch: Partial<Pick<CategoryDefinition, "label" | "colorKey">>,
): CategoryDefinition | null {
  const list = getCategories();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const current = list[idx];
  const next: CategoryDefinition = {
    ...current,
    label:
      typeof patch.label === "string"
        ? patch.label.slice(0, MAX_CATEGORY_LABEL_LENGTH)
        : current.label,
    colorKey: patch.colorKey ?? current.colorKey,
  };
  const updated = [...list];
  updated[idx] = next;
  saveCategories(updated);
  return next;
}

/**
 * Remove a category. Refuses to remove the last remaining category — at least
 * one must exist so events always have a valid (or fallback) target.
 *
 * If the removed category was one of the seeded defaults, its id is added to
 * the deleted-defaults tombstone set so `getCategories()` doesn't merge it
 * back in on future reads.
 *
 * Caller is responsible for reassigning events that referenced this category.
 */
export function deleteCategory(id: string): boolean {
  const list = getCategories();
  const target = list.find((c) => c.id === id);
  if (!target) return false;
  if (list.length <= 1) return false;

  const next = list.filter((c) => c.id !== id);
  saveCategories(next);

  if (target.isDefault) {
    const tombstones = getDeletedDefaultIds();
    tombstones.add(target.id);
    saveDeletedDefaultIds(tombstones);
  }

  return true;
}
