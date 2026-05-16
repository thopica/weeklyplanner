import { PlannerSection } from "@/components/PlannerSection";
import { plannerFieldClass } from "@/lib/planner-field";

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
              className={plannerFieldClass("sm", "flex-1")}
            />
          </div>
        ))}
      </div>
    </PlannerSection>
  );
}
