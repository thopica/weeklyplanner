interface GratitudeSectionProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export function GratitudeSection({ items, onChange }: GratitudeSectionProps) {
  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="mb-8" data-testid="gratitude-section">
      <h2
        className="text-[10px] font-bold uppercase tracking-widest mb-1"
        style={{ color: "hsl(var(--primary))" }}
      >
        Gratitude
      </h2>
      <p className="text-xs text-muted-foreground mb-4 italic" style={{ fontFamily: "'Lora', Georgia, serif" }}>
        Today I am grateful for…
      </p>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="text-xs font-bold tabular-nums shrink-0"
              style={{ color: "hsl(var(--primary) / 0.45)" }}
            >
              {i + 1}.
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder="Something good today…"
              data-testid={`gratitude-input-${i}`}
              className="flex-1 bg-transparent border-b py-1.5 text-sm focus:outline-none transition-colors"
              style={{
                borderColor: item ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              onFocus={(e) => (e.target.style.borderColor = "hsl(var(--primary) / 0.6)")}
              onBlur={(e) =>
                (e.target.style.borderColor = item
                  ? "hsl(var(--primary) / 0.3)"
                  : "hsl(var(--border))")
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
