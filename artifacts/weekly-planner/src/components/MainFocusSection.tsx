interface MainFocusSectionProps {
  focus: string;
  onChange: (focus: string) => void;
}

export function MainFocusSection({ focus, onChange }: MainFocusSectionProps) {
  return (
    <div className="mb-10" data-testid="main-focus-section">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
        Today's Main Focus
      </h2>
      <input
        type="text"
        value={focus}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What is the one thing you must accomplish today?"
        data-testid="input-main-focus"
        className="w-full bg-transparent border-none text-2xl md:text-3xl font-serif text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0"
        style={{ fontFamily: "'Lora', Georgia, serif" }}
      />
      <div
        className="mt-3 h-px w-full"
        style={{
          background: "linear-gradient(to right, hsl(var(--primary) / 0.5), transparent)",
        }}
      />
    </div>
  );
}
