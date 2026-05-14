import { useState } from "react";
import { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, GripVertical } from "lucide-react";
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
      text: newTaskText,
      completed: false,
      createdAt: new Date().toISOString()
    };

    onChange([...tasks, newTask]);
    setNewTaskText("");
  };

  const toggleTask = (id: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    
    // Sort so completed are at the bottom
    updatedTasks.sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });

    onChange(updatedTasks);
  };

  const deleteTask = (id: string) => {
    onChange(tasks.filter(t => t.id !== id));
  };

  const updateTaskText = (id: string, text: string) => {
    onChange(tasks.map(t => t.id === id ? { ...t, text } : t));
  };

  return (
    <div className="mb-8">
      <h2 className={`text-sm font-semibold uppercase tracking-widest text-${accentColor} mb-4`}>{title}</h2>
      
      <div className="space-y-2 mb-4">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground italic py-2"
            >
              No tasks yet. Take a deep breath.
            </motion.div>
          )}
          {tasks.map(task => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              key={task.id}
              className={`group flex items-center gap-3 p-2 md:p-3 rounded-lg border border-transparent transition-all duration-300 ${
                task.completed ? 'bg-card/50 opacity-60' : 'bg-card shadow-sm hover:border-card-border'
              }`}
            >
              <Checkbox 
                checked={task.completed} 
                onCheckedChange={() => toggleTask(task.id)}
                className={`w-5 h-5 rounded-full border-2 ${task.completed ? 'data-[state=checked]:bg-primary data-[state=checked]:border-primary' : 'border-muted-foreground'}`}
              />
              <input
                type="text"
                value={task.text}
                onChange={(e) => updateTaskText(task.id, e.target.value)}
                className={`flex-1 bg-transparent border-none text-base focus:outline-none transition-all duration-300 ${
                  task.completed ? 'line-through text-muted-foreground' : 'text-card-foreground'
                }`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleAddTask} className="flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="bg-card border-card-border focus-visible:ring-primary/20"
        />
        <Button type="submit" size="icon" variant="secondary" className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Plus className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
