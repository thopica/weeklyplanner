import { useState } from "react";
import { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskListProps {
  title: string;
  tasks: Task[];
  onChange: (tasks: Task[]) => void;
  accentColor?: "primary" | "secondary";
}

export function TaskList({ title, tasks, onChange, accentColor = "primary" }: TaskListProps) {
  const [newTaskText, setNewTaskText] = useState("");

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
    // Completed tasks sink to the bottom, preserving relative order within each group
    const incomplete = updated.filter((t) => !t.completed);
    const complete = updated.filter((t) => t.completed);
    onChange([...incomplete, ...complete]);
  };

  const deleteTask = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
  };

  const updateTaskText = (id: string, text: string) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  // Use inline style so the color survives Tailwind's purge
  const accentStyle =
    accentColor === "primary"
      ? { color: "hsl(var(--primary))" }
      : { color: "hsl(var(--secondary))" };

  const remainingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="mb-8" data-testid={`task-list-${accentColor}`}>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[10px] font-bold uppercase tracking-widest"
          style={accentStyle}
        >
          {title}
        </h2>
        {tasks.length > 0 && (
          <span className="text-[10px] font-semibold text-muted-foreground">
            {remainingCount} remaining
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground italic py-2"
            >
              No tasks yet. Take a deep breath.
            </motion.p>
          )}
          {tasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: task.completed ? 0.55 : 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
                task.completed
                  ? "border-transparent bg-transparent"
                  : "bg-card border-card-border shadow-sm hover:shadow"
              }`}
              data-testid={`task-item-${task.id}`}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                data-testid={`task-checkbox-${task.id}`}
                className="w-5 h-5 rounded-full border-2 shrink-0"
                style={task.completed ? {} : { borderColor: "hsl(var(--border))" }}
              />
              <input
                type="text"
                value={task.text}
                onChange={(e) => updateTaskText(task.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                data-testid={`task-input-${task.id}`}
                className="flex-1 bg-transparent border-none text-sm focus:outline-none transition-all duration-300 min-w-0"
                style={{
                  textDecoration: task.completed ? "line-through" : "none",
                  color: task.completed
                    ? "hsl(var(--muted-foreground))"
                    : "hsl(var(--foreground))",
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
                data-testid={`task-delete-${task.id}`}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity h-7 w-7 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add task form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          data-testid={`input-new-task-${accentColor}`}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-card border border-card-border focus:outline-none focus:ring-2 transition-all min-w-0"
          style={{ "--tw-ring-color": "hsl(var(--primary) / 0.2)" } as React.CSSProperties}
        />
        <button
          type="submit"
          data-testid={`button-add-task-${accentColor}`}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: "hsl(var(--secondary))",
            color: "hsl(var(--secondary-foreground))",
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
