import { PlannerSection } from "@/components/PlannerSection";

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
    <PlannerSection
      variant="default"
      layout="standalone"
      step={3}
      id="gratitude"
      title="Gratitude"
      data-testid="gratitude-section"
    >
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="type-caption shrink-0 font-bold tabular-nums text-primary">
              {i + 1}.
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder="Something good today…"
              data-testid={`gratitude-input-${i}`}
              className="type-ui flex-1 border-b border-border bg-transparent py-1.5 text-foreground transition-colors focus:border-primary focus:outline-none"
            />
          </div>
        ))}
      </div>
    </PlannerSection>
  );
}
