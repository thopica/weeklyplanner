import { useState } from "react";
import { Pencil, Plus, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  HabitDefinition,
  HabitKind,
  MAX_HABIT_NAME_LENGTH,
  MAX_HABITS,
} from "@/lib/types";
import { getHabits, pruneHabitLogs, saveHabits } from "@/lib/storage";

interface HabitsSettingsProps {
  onHabitsChange: () => void;
}

interface HabitDraft {
  name: string;
  kind: HabitKind;
  unit: string;
  goal: string;
}

const emptyDraft = (): HabitDraft => ({
  name: "",
  kind: "boolean",
  unit: "",
  goal: "",
});

function validateDraft(draft: HabitDraft): string | null {
  const name = draft.name.trim();
  if (!name) return "Name is required.";
  if (name.length > MAX_HABIT_NAME_LENGTH) {
    return `Name must be ${MAX_HABIT_NAME_LENGTH} characters or fewer.`;
  }
  if (draft.kind === "quantifiable") {
    if (!draft.unit.trim()) {
      return "Unit is required for measurable habits (e.g. steps, glasses).";
    }
    const goal = Number(draft.goal);
    if (!Number.isInteger(goal) || goal < 1) {
      return "Daily goal must be a whole number of at least 1.";
    }
  }
  return null;
}

function draftToHabit(draft: HabitDraft, existing?: HabitDefinition): HabitDefinition {
  const name = draft.name.trim();
  if (draft.kind === "boolean") {
    return {
      id: existing?.id ?? `habit-${Date.now()}`,
      name,
      kind: "boolean",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
  }
  return {
    id: existing?.id ?? `habit-${Date.now()}`,
    name,
    kind: "quantifiable",
    unit: draft.unit.trim(),
    target: Math.max(1, Math.floor(Number(draft.goal))),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

function habitToDraft(habit: HabitDefinition): HabitDraft {
  return {
    name: habit.name,
    kind: habit.kind,
    unit: habit.unit ?? "",
    goal: habit.kind === "quantifiable" ? String(habit.target ?? "") : "",
  };
}

export function HabitsSettings({ onHabitsChange }: HabitsSettingsProps) {
  const [habits, setHabits] = useState<HabitDefinition[]>(() => getHabits());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<HabitDraft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  const persist = (next: HabitDefinition[]) => {
    saveHabits(next);
    setHabits(next);
    onHabitsChange();
  };

  const resetForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setDraft(emptyDraft());
    setError(null);
  };

  const handleSave = () => {
    const validationError = validateDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (editingId) {
      persist(habits.map((h) => (h.id === editingId ? draftToHabit(draft, h) : h)));
    } else {
      if (habits.length >= MAX_HABITS) {
        setError(`You can add up to ${MAX_HABITS} habits.`);
        return;
      }
      persist([...habits, draftToHabit(draft)]);
    }
    resetForm();
  };

  const handleEdit = (habit: HabitDefinition) => {
    setIsAdding(false);
    setEditingId(habit.id);
    setDraft(habitToDraft(habit));
    setError(null);
  };

  const handleDelete = (habit: HabitDefinition) => {
    if (!confirm(`Delete "${habit.name}"? Past daily logs for this habit will be removed.`)) {
      return;
    }
    pruneHabitLogs([habit.id]);
    persist(habits.filter((h) => h.id !== habit.id));
    if (editingId === habit.id) resetForm();
  };

  const handleStartAdd = () => {
    if (habits.length >= MAX_HABITS) {
      setError(`You can add up to ${MAX_HABITS} habits.`);
      return;
    }
    setEditingId(null);
    setIsAdding(true);
    setDraft(emptyDraft());
    setError(null);
  };

  const showForm = isAdding || editingId !== null;

  return (
    <section data-testid="habits-settings">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Target className="h-4 w-4" />
        Habits
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Define habits once—they appear on each day&apos;s planner. For measurable habits, set the
        daily goal here; you only log the actual number each day.
      </p>

      {habits.length === 0 && !showForm && (
        <p className="mb-4 text-sm text-muted-foreground">
          No habits yet. Add habits here—they&apos;ll appear on each day&apos;s planner.
        </p>
      )}

      <ul className="mb-4 space-y-2">
        {habits.map((habit) =>
          editingId === habit.id ? null : (
            <li
              key={habit.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
              data-testid={`habit-settings-row-${habit.id}`}
            >
              <HabitSummary habit={habit} />
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 sm:h-8 sm:w-8"
                  onClick={() => handleEdit(habit)}
                  aria-label={`Edit ${habit.name}`}
                  data-testid={`button-edit-habit-${habit.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive hover:text-destructive sm:h-8 sm:w-8"
                  onClick={() => handleDelete(habit)}
                  aria-label={`Delete ${habit.name}`}
                  data-testid={`button-delete-habit-${habit.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {showForm && (
        <div className="mb-4 space-y-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="grid gap-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder='e.g. "Daily steps"'
              maxLength={MAX_HABIT_NAME_LENGTH}
              data-testid="input-habit-name"
            />
          </div>

          <HabitTypeField draft={draft} setDraft={setDraft} />

          {draft.kind === "quantifiable" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="habit-goal">Daily goal</Label>
                <Input
                  id="habit-goal"
                  type="text"
                  inputMode="numeric"
                  value={draft.goal}
                  onChange={(e) =>
                    setDraft({ ...draft, goal: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="1000"
                  data-testid="input-habit-goal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="habit-unit">Unit</Label>
                <Input
                  id="habit-unit"
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                  placeholder="steps, glasses, hours"
                  data-testid="input-habit-unit"
                />
              </div>
            </div>
          )}

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
              data-testid="button-save-habit"
            >
              {editingId ? "Save changes" : "Add habit"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 text-sm"
              onClick={resetForm}
              data-testid="button-cancel-habit"
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
          disabled={habits.length >= MAX_HABITS}
          data-testid="button-add-habit"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add habit
        </Button>
      )}

      {error && !showForm && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function HabitSummary({ habit }: { habit: HabitDefinition }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-foreground">{habit.name}</p>
      <p className="text-xs text-muted-foreground">
        {habit.kind === "boolean"
          ? "Daily check-off"
          : `Goal ${habit.target?.toLocaleString() ?? "—"} ${habit.unit ?? ""}`.trim()}
      </p>
    </div>
  );
}

function HabitTypeField({
  draft,
  setDraft,
}: {
  draft: HabitDraft;
  setDraft: (d: HabitDraft) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>Type</Label>
      <RadioGroup
        value={draft.kind}
        onValueChange={(v) => setDraft({ ...draft, kind: v as HabitKind })}
        className="flex flex-col gap-2 sm:flex-row sm:gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="boolean" id="habit-kind-boolean" />
          <Label htmlFor="habit-kind-boolean" className="font-normal">
            Daily check-off
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="quantifiable" id="habit-kind-quantifiable" />
          <Label htmlFor="habit-kind-quantifiable" className="font-normal">
            Track a number
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
