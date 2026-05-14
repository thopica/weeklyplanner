import { Textarea } from "@/components/ui/textarea";

interface GratitudeSectionProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export function GratitudeSection({ items, onChange }: GratitudeSectionProps) {
  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-card-border mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-bl-full -z-10"></div>
      
      <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-1">Gratitude</h2>
      <p className="text-xs text-muted-foreground mb-4 font-serif italic">Today, I am grateful for...</p>
      
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-secondary font-serif text-sm mt-1">{i + 1}.</span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="flex-1 bg-transparent border-b border-muted hover:border-primary/50 focus:border-primary px-1 py-1 text-sm focus:outline-none transition-colors"
              placeholder="..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}
