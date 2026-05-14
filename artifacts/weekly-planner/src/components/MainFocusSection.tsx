import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

interface MainFocusSectionProps {
  focus: string;
  completed: boolean;
  onChange: (focus: string) => void;
  onToggle: () => void;
}

export function MainFocusSection({ focus, completed, onChange, onToggle }: MainFocusSectionProps) {
  return (
    <div className="mb-10" data-testid="main-focus-section">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
        Today's Main Focus
      </h2>

      <div
        className="relative rounded-2xl px-5 py-5 transition-all duration-500"
        style={{
          background: completed
            ? "hsl(var(--secondary) / 0.25)"
            : "hsl(var(--primary) / 0.06)",
          border: completed
            ? "1.5px solid hsl(var(--secondary) / 0.4)"
            : "1.5px solid hsl(var(--primary) / 0.2)",
        }}
      >
        {/* Completion toggle */}
        <button
          onClick={onToggle}
          data-testid="button-focus-complete"
          title={completed ? "Mark as incomplete" : "Mark as complete"}
          className="absolute top-4 right-4 transition-all duration-300 hover:scale-110"
          style={{ color: completed ? "hsl(var(--secondary))" : "hsl(var(--primary) / 0.35)" }}
        >
          <motion.div
            initial={false}
            animate={{ rotate: completed ? 0 : 0, scale: completed ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {completed ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </motion.div>
        </button>

        {/* Text input */}
        <input
          type="text"
          value={focus}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What is the one thing you must accomplish today?"
          data-testid="input-main-focus"
          disabled={completed}
          className="w-full bg-transparent border-none pr-8 focus:outline-none focus:ring-0 transition-all duration-300"
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
            fontWeight: 600,
            lineHeight: 1.35,
            color: completed
              ? "hsl(var(--muted-foreground))"
              : "hsl(var(--foreground))",
            textDecoration: completed ? "line-through" : "none",
          }}
        />

        {/* Completed stamp */}
        {completed && focus && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "hsl(var(--secondary))" }}
          >
            ✓ Accomplished
          </motion.p>
        )}
      </div>
    </div>
  );
}
