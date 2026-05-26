import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addEvent,
  buildFloatingDateTime,
  dayEndExclusive,
  deleteEvent,
  updateEvent,
} from "@/lib/events";
import { projectEventsToDayBlocks } from "@/lib/event-projection";
import { getCategories } from "@/lib/categories";
import { paletteFor } from "@/lib/palette";
import { hasTimeConflict, formatScheduleTime } from "@/lib/schedule";
import {
  type CalendarEvent,
  type CategoryDefinition,
  FALLBACK_CATEGORY_ID,
  MAX_EVENT_TITLE_LENGTH,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export type EventDialogConfig =
  | {
      mode: "create";
      defaultDateStr: string;
      defaultStartMinute?: number;
      defaultDurationMinutes?: number;
      defaultAllDay?: boolean;
      source?: "month-cell" | "day-schedule" | "day-allday";
    }
  | { mode: "edit"; event: CalendarEvent };

export interface EventDialogProps {
  config: EventDialogConfig | null;
  onClose: () => void;
  /** Parent should bump its dataVersion / eventsVersion here. */
  onSaved: () => void;
}

interface FormState {
  title: string;
  dateStr: string;
  allDay: boolean;
  startMin: number;
  endMin: number;
  categoryId: string;
  important: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_START_MIN = 9 * 60;
const DEFAULT_DURATION_MIN = 60;
const SLOT = 30;

function startTicks(): number[] {
  const out: number[] = [];
  for (let m = 0; m < 24 * 60; m += SLOT) out.push(m);
  return out;
}

function endTicks(): number[] {
  const out: number[] = [];
  for (let m = SLOT; m <= 24 * 60; m += SLOT) out.push(m);
  return out;
}

function minutesFromFloating(value: string): number {
  const h = Number(value.slice(11, 13));
  const m = Number(value.slice(14, 16));
  return h * 60 + m;
}

function endMinutesForEvent(event: CalendarEvent): number {
  const startDate = event.startsAt.slice(0, 10);
  const endDate = event.endsAt.slice(0, 10);
  if (endDate === startDate) return minutesFromFloating(event.endsAt);
  // Multi-day or ends at next day's 00:00 -> treat as end-of-day for this dialog.
  return 24 * 60;
}

function initialStateFromConfig(
  config: EventDialogConfig,
  categories: CategoryDefinition[],
): FormState {
  const fallbackCategoryId =
    categories.find((c) => c.id === FALLBACK_CATEGORY_ID)?.id ??
    categories[0]?.id ??
    FALLBACK_CATEGORY_ID;

  if (config.mode === "edit") {
    const event = config.event;
    return {
      title: event.title,
      dateStr: event.startsAt.slice(0, 10),
      allDay: event.allDay,
      startMin: event.allDay ? 0 : minutesFromFloating(event.startsAt),
      endMin: event.allDay ? 24 * 60 : endMinutesForEvent(event),
      categoryId: event.categoryId || fallbackCategoryId,
      important: event.important,
    };
  }

  const allDay = config.defaultAllDay ?? false;
  const startMin = allDay ? 0 : config.defaultStartMinute ?? DEFAULT_START_MIN;
  const durationMinutes = config.defaultDurationMinutes ?? DEFAULT_DURATION_MIN;
  const endMin = allDay
    ? 24 * 60
    : Math.min(24 * 60, startMin + durationMinutes);

  return {
    title: "",
    dateStr: config.defaultDateStr,
    allDay,
    startMin,
    endMin,
    categoryId: fallbackCategoryId,
    important: false,
  };
}

function formatEndOption(end: number): string {
  if (end >= 24 * 60) return "12:00 AM";
  return formatScheduleTime(end);
}

export function EventDialog({ config, onClose, onSaved }: EventDialogProps) {
  const open = config !== null;
  const editingId = config?.mode === "edit" ? config.event.id : null;

  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) {
      setForm(null);
      setFormError(null);
      return;
    }
    const cats = getCategories();
    setCategories(cats);
    setForm(initialStateFromConfig(config, cats));
    setFormError(null);
  }, [config]);

  const startOptions = useMemo(() => startTicks(), []);
  const endOptions = useMemo(() => {
    if (!form) return [];
    return endTicks().filter((m) => m > form.startMin);
  }, [form?.startMin]);

  if (!open || !form) {
    return (
      <Dialog open={false} onOpenChange={(o) => !o && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }

  const isEdit = config!.mode === "edit";

  const patch = (next: Partial<FormState>) => {
    setForm((f) => (f ? { ...f, ...next } : f));
    setFormError(null);
  };

  const handleStartChange = (value: string) => {
    const next = Number(value);
    setForm((f) => {
      if (!f) return f;
      // Keep the existing duration if possible; otherwise snap end forward.
      const prevDur = Math.max(SLOT, f.endMin - f.startMin);
      const candidateEnd = Math.min(24 * 60, next + prevDur);
      const endMin = candidateEnd > next ? candidateEnd : Math.min(24 * 60, next + SLOT);
      return { ...f, startMin: next, endMin };
    });
    setFormError(null);
  };

  const handleSave = () => {
    if (!form) return;
    const title = form.title.trim().slice(0, MAX_EVENT_TITLE_LENGTH);
    const dateStr = form.dateStr;

    if (!DATE_RE.test(dateStr)) {
      setFormError("Pick a valid date.");
      return;
    }

    if (form.allDay) {
      const startsAt = `${dateStr}T00:00:00`;
      const endsAt = dayEndExclusive(dateStr);
      try {
        if (isEdit && editingId) {
          updateEvent(editingId, {
            title,
            startsAt,
            endsAt,
            allDay: true,
            categoryId: form.categoryId,
            important: form.important,
          });
        } else {
          addEvent({
            title,
            startsAt,
            endsAt,
            allDay: true,
            categoryId: form.categoryId,
            important: form.important,
          });
        }
      } catch (e) {
        console.error("Failed to save event", e);
        setFormError("Could not save. Try again.");
        return;
      }
      onSaved();
      onClose();
      return;
    }

    if (form.endMin <= form.startMin) {
      setFormError("End time must be after the start time.");
      return;
    }

    const duration = form.endMin - form.startMin;
    const otherBlocks = projectEventsToDayBlocks(dateStr);
    if (
      hasTimeConflict(form.startMin, duration, otherBlocks, editingId ?? undefined)
    ) {
      setFormError("This overlaps another event on that day.");
      return;
    }

    const startsAt = buildFloatingDateTime(dateStr, form.startMin);
    const endsAt =
      form.endMin >= 24 * 60
        ? dayEndExclusive(dateStr)
        : buildFloatingDateTime(dateStr, form.endMin);

    try {
      if (isEdit && editingId) {
        updateEvent(editingId, {
          title,
          startsAt,
          endsAt,
          allDay: false,
          categoryId: form.categoryId,
          important: form.important,
        });
      } else {
        addEvent({
          title,
          startsAt,
          endsAt,
          allDay: false,
          categoryId: form.categoryId,
          important: form.important,
        });
      }
    } catch (e) {
      console.error("Failed to save event", e);
      setFormError("Could not save. Try again.");
      return;
    }
    onSaved();
    onClose();
  };

  const handleDelete = () => {
    if (!isEdit || !editingId) return;
    try {
      deleteEvent(editingId);
    } catch (e) {
      console.error("Failed to delete event", e);
      setFormError("Could not delete. Try again.");
      return;
    }
    onSaved();
    onClose();
  };

  const selectedCategory =
    categories.find((c) => c.id === form.categoryId) ?? categories[0];
  const selectedPalette = selectedCategory
    ? paletteFor(selectedCategory.colorKey)
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-md gap-0 border-border p-6 shadow-tinted sm:rounded-xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="type-section-title">
            {isEdit ? "Edit event" : "New event"}
          </DialogTitle>
        </DialogHeader>

        {formError ? (
          <div
            role="alert"
            aria-live="polite"
            className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="type-ui leading-snug">{formError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="What is this event?"
              maxLength={MAX_EVENT_TITLE_LENGTH}
              autoFocus
              data-testid="input-event-title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="event-date">Date</Label>
            <Input
              id="event-date"
              type="date"
              value={form.dateStr}
              onChange={(e) => patch({ dateStr: e.target.value })}
              data-testid="input-event-date"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="event-allday" className="cursor-pointer">
              All day
            </Label>
            <Switch
              id="event-allday"
              checked={form.allDay}
              onCheckedChange={(checked) => patch({ allDay: checked })}
              data-testid="switch-event-allday"
            />
          </div>

          {!form.allDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="event-start">Start</Label>
                <Select
                  value={String(form.startMin)}
                  onValueChange={handleStartChange}
                >
                  <SelectTrigger id="event-start" data-testid="select-event-start">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {startOptions.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {formatScheduleTime(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-end">End</Label>
                <Select
                  value={String(form.endMin)}
                  onValueChange={(v) => patch({ endMin: Number(v) })}
                >
                  <SelectTrigger id="event-end" data-testid="select-event-end">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {endOptions.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {formatEndOption(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="event-category">Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => patch({ categoryId: v })}
            >
              <SelectTrigger id="event-category" data-testid="select-event-category">
                <span className="flex items-center gap-2">
                  {selectedPalette ? (
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: selectedPalette.dot }}
                    />
                  ) : null}
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {categories.map((cat) => {
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

          <button
            type="button"
            onClick={() => patch({ important: !form.important })}
            aria-pressed={form.important}
            data-testid="toggle-event-important"
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors",
              form.important
                ? "border-primary bg-surface-accent text-foreground"
                : "border-border text-foreground hover:bg-accent",
            )}
          >
            <span className="flex items-center gap-2">
              <Flag
                className="h-4 w-4"
                strokeWidth={2}
                fill={form.important ? "#D85A30" : "none"}
                color={form.important ? "#D85A30" : "currentColor"}
              />
              <span className="type-ui">Important</span>
            </span>
            <span className="type-meta text-muted-foreground">
              {form.important ? "On" : "Off"}
            </span>
          </button>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {isEdit ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              data-testid="button-event-delete"
            >
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              data-testid="button-event-save"
            >
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
