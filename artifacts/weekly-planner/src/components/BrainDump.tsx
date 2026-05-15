import { PlannerSection } from "@/components/PlannerSection";

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
        className="type-body scrollbar-hide w-full resize-none rounded-lg border border-border bg-background px-3 py-3 focus:outline-none focus:ring-2 focus:ring-ring motion-reduce:transition-none"
      />
    </PlannerSection>
  );
}
