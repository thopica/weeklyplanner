import { PlannerSection } from "@/components/PlannerSection";
import { plannerFieldClass } from "@/lib/planner-field";

interface BrainDumpProps {
  text: string;
  onChange: (text: string) => void;
}

export function BrainDump({ text, onChange }: BrainDumpProps) {
  return (
    <PlannerSection
      variant="default"
      layout="standalone"
      step={4}
      id="brain-dump"
      title="Brain dump"
      description="Capture loose thoughts so your task list stays honest."
      data-testid="brain-dump-section"
    >
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Thoughts, ideas, loose ends…"
        data-testid="brain-dump-input"
        rows={5}
        className={plannerFieldClass("md", "type-body scrollbar-hide min-h-[7.5rem] resize-none")}
      />
    </PlannerSection>
  );
}
