import { Textarea } from "@/components/ui/textarea";

interface BrainDumpProps {
  text: string;
  onChange: (text: string) => void;
}

export function BrainDump({ text, onChange }: BrainDumpProps) {
  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-card-border h-full min-h-[200px] flex flex-col">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-4">Brain Dump</h2>
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jot down thoughts, ideas, or anything else..."
        className="flex-1 resize-none bg-transparent border-none p-0 focus-visible:ring-0 text-sm leading-relaxed"
      />
    </div>
  );
}
