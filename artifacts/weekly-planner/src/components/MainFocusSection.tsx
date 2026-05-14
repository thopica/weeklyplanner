import { useState } from "react";
import { format } from "date-fns";

interface MainFocusSectionProps {
  focus: string;
  onChange: (focus: string) => void;
}

export function MainFocusSection({ focus, onChange }: MainFocusSectionProps) {
  return (
    <div className="mb-10">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-secondary mb-3">Today's Main Focus</h2>
      <input
        type="text"
        value={focus}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What is the one thing you must accomplish today?"
        className="w-full bg-transparent border-none text-2xl md:text-3xl font-serif text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
      />
      <div className="h-px w-full bg-gradient-to-r from-primary/50 to-transparent mt-2"></div>
    </div>
  );
}
