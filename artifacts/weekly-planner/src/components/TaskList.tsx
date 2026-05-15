import { useState } from "react";
import { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { tasteSpringLayout, tasteTransition } from "@/lib/motion";
import { PlannerSection } from "@/components/PlannerSection";
import { cn } from "@/lib/utils";

interface TaskListProps {
  title: string;
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  accentColor?: "primary" | "secondary";
}

export function TaskList({ title, tasks, onChange, accentColor = "primary" }: TaskListProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const reduceMotion = useReducedMotion();
  const listTransition = tasteTransition(reduceMotion, tasteSpringLayout);

  const handleAddTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
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

  return (
    <PlannerSection
      variant="default"
      layout="standalone"
      step={2}
      id="tasks"
      title={title}
      description="Short, concrete tasks that support your focus."
      data-testid={`task-list-${accentColor}`}
    >
      <div className="overflow-hidden rounded-lg border border-border bg-surface-subtle">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 && (
            <motion.p
              key="empty"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={listTransition}
              className="type-ui px-3 py-4 text-muted-foreground"
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
                "group flex items-center gap-3 px-3 py-2.5",
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
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                data-testid={`task-input-${task.id}`}
                className={cn(
                  "type-ui min-w-0 flex-1 border-none bg-transparent focus:outline-none",
                  task.completed
                    ? "font-medium text-foreground-subtle line-through"
                    : "text-foreground",
                )}
              />
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
          className="flex gap-2 border-t border-border-strong bg-card px-3 py-2.5"
        >
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a task…"
            data-testid={`input-new-task-${accentColor}`}
            className="type-ui min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring motion-reduce:transition-none"
          />
          <Button
            type="submit"
            size="icon"
            data-testid={`button-add-task-${accentColor}`}
            className="h-9 w-9 shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </Button>
        </form>
      </div>
    </PlannerSection>
  );
}
