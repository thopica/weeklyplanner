import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Task } from "@/lib/types";
import { createTaskId } from "@/lib/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, CalendarDays } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { tasteSpringLayout, tasteTransition } from "@/lib/motion";
import { PlannerSection } from "@/components/PlannerSection";
import { plannerFieldClass } from "@/lib/planner-field";
import { cn } from "@/lib/utils";

interface TaskListProps {
  title: string;
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  sourceDateStr: string;
  onMoveTask?: (taskId: string, toDateStr: string) => void;
  accentColor?: "primary" | "secondary";
}

export function TaskList({
  title,
  tasks,
  onChange,
  sourceDateStr,
  onMoveTask,
  accentColor = "primary",
}: TaskListProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [moveTask, setMoveTask] = useState<Task | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState(sourceDateStr);
  const reduceMotion = useReducedMotion();
  const listTransition = tasteTransition(reduceMotion, tasteSpringLayout);

  const openCount = tasks.filter((t) => t.text.trim() && !t.completed).length;
  const totalMeaningful = tasks.filter((t) => t.text.trim()).length;
  const allDone = totalMeaningful > 0 && openCount === 0;

  const handleAddTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: createTaskId(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    onChange([...tasks, newTask]);
    setNewTaskText("");
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    const incomplete = updated.filter((t) => !t.completed);
    const complete = updated.filter((t) => t.completed);
    onChange([...incomplete, ...complete]);
  };

  const deleteTask = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
  };

  const requestDeleteTask = (task: Task) => {
    const label = task.text.trim();
    const prompt = label
      ? `Remove "${label.length > 48 ? `${label.slice(0, 48)}…` : label}"?`
      : "Remove this task?";
    if (!window.confirm(prompt)) return;
    deleteTask(task.id);
  };

  const updateTaskText = (id: string, text: string) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const openMoveDialog = (task: Task) => {
    setMoveTask(task);
    setMoveTargetDate(sourceDateStr);
  };

  const confirmMove = () => {
    if (!moveTask || !onMoveTask) return;
    if (moveTargetDate === sourceDateStr) {
      setMoveTask(null);
      return;
    }
    onMoveTask(moveTask.id, moveTargetDate);
    setMoveTask(null);
  };

  const moveTargetLabel = moveTargetDate
    ? format(parseISO(`${moveTargetDate}T12:00:00`), "EEEE, MMM d")
    : "";

  return (
    <PlannerSection
      variant="default"
      layout="standalone"
      step={2}
      id="tasks"
      title={title}
      data-testid={`task-list-${accentColor}`}
      headerEnd={
        openCount > 0 ? (
          <span className="type-caption font-medium tabular-nums text-muted-foreground">
            {openCount} open
          </span>
        ) : allDone ? (
          <span className="type-caption font-medium text-secondary">Done</span>
        ) : null
      }
    >
      <div>
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 && (
            <motion.p
              key="empty"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={listTransition}
              className="type-ui py-3 text-muted-foreground"
            >
              Nothing here yet. Add what matters for today.
            </motion.p>
          )}
          {tasks.map((task, index) => (
            <motion.div
              layout
              key={task.id}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
              transition={listTransition}
              className={cn(
                "group flex items-center gap-3 py-2.5",
                index > 0 && "border-t border-border-strong",
              )}
              data-testid={`task-item-${task.id}`}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                data-testid={`task-checkbox-${task.id}`}
                className="h-5 w-5 shrink-0 rounded-full border-2 border-border"
              />
              <input
                type="text"
                value={task.text}
                onChange={(e) => updateTaskText(task.id, e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value.trim()) deleteTask(task.id);
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                data-testid={`task-input-${task.id}`}
                className={cn(
                  plannerFieldClass("sm", "min-w-0 flex-1"),
                  task.completed &&
                    "border-border/60 bg-surface-subtle/80 font-medium text-foreground-subtle line-through shadow-none hover:border-border/60 focus:border-border/60 focus:shadow-none",
                )}
              />
              {onMoveTask ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openMoveDialog(task)}
                  data-testid={`task-move-${task.id}`}
                  aria-label={
                    task.text.trim()
                      ? `Move task to another day: ${task.text}`
                      : "Move task to another day"
                  }
                  className="h-7 w-7 shrink-0 text-muted-foreground/70 transition-opacity hover:text-foreground group-hover:text-muted-foreground focus-visible:text-muted-foreground"
                >
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => requestDeleteTask(task)}
                data-testid={`task-delete-${task.id}`}
                aria-label={task.text.trim() ? `Remove task: ${task.text}` : "Remove task"}
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        <form
          onSubmit={handleAddTask}
          className="flex items-center gap-3 border-t border-border-strong pt-2.5"
        >
          <Button
            type="submit"
            size="icon"
            data-testid={`button-add-task-${accentColor}`}
            aria-label="Add task"
            className="h-5 w-5 shrink-0 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Button>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a task…"
            data-testid={`input-new-task-${accentColor}`}
            className={plannerFieldClass("sm", "min-w-0 flex-1")}
          />
          {onMoveTask ? (
            <span className="h-7 w-7 shrink-0" aria-hidden />
          ) : null}
          <span className="h-7 w-7 shrink-0" aria-hidden />
        </form>
      </div>

      <Dialog
        open={!!moveTask}
        onOpenChange={(open) => {
          if (!open) setMoveTask(null);
        }}
      >
        <DialogContent className="max-w-sm gap-0 border-border p-6 shadow-tinted sm:rounded-xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="type-section-title">Move to day</DialogTitle>
            <DialogDescription className="type-ui">
              {moveTask?.text.trim()
                ? `“${moveTask.text.length > 56 ? `${moveTask.text.slice(0, 56)}…` : moveTask.text}”`
                : "Choose a day for this task."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="move-task-date">Date</Label>
            <input
              id="move-task-date"
              type="date"
              value={moveTargetDate}
              onChange={(e) => setMoveTargetDate(e.target.value)}
              data-testid="input-move-task-date"
              className="type-ui w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {moveTargetDate && moveTargetDate !== sourceDateStr ? (
              <p className="type-caption text-muted-foreground">{moveTargetLabel}</p>
            ) : null}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setMoveTask(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmMove}
              disabled={!moveTargetDate || moveTargetDate === sourceDateStr}
              data-testid="button-confirm-move-task"
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlannerSection>
  );
}
