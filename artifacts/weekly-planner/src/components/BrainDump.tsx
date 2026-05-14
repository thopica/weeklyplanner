interface BrainDumpProps {
  text: string;
  onChange: (text: string) => void;
}

export function BrainDump({ text, onChange }: BrainDumpProps) {
  return (
    <div className="mb-8" data-testid="brain-dump-section">
      <h2
        className="text-[10px] font-bold uppercase tracking-widest mb-1"
        style={{ color: "hsl(var(--primary))" }}
      >
        Brain Dump
      </h2>
      <p className="text-xs text-muted-foreground mb-4 italic" style={{ fontFamily: "'Lora', Georgia, serif" }}>
        Get it out of your head…
      </p>

      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Thoughts, ideas, loose ends, random things to remember…"
        data-testid="brain-dump-input"
        rows={5}
        className="w-full bg-transparent border rounded-xl px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none transition-colors scrollbar-hide"
        style={{
          borderColor: text ? "hsl(var(--primary) / 0.25)" : "hsl(var(--border))",
          color: "hsl(var(--foreground))",
        }}
        onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary) / 0.5)")}
        onBlur={(e) =>
          (e.target.style.borderColor = text
            ? "hsl(var(--primary) / 0.25)"
            : "hsl(var(--border))")
        }
      />
    </div>
  );
}
