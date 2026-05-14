import { TimeBlock } from "@/lib/types";

interface TimeBlockScheduleProps {
  blocks: TimeBlock[];
  onChange: (blocks: TimeBlock[]) => void;
}

export function TimeBlockSchedule({ blocks, onChange }: TimeBlockScheduleProps) {
  const updateBlockLabel = (id: string, label: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, label } : b));
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour} ${ampm}`;
  };

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-card-border h-[600px] flex flex-col">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">Schedule</h2>
      
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-0 relative">
        {/* Timeline line */}
        <div className="absolute left-[39px] top-4 bottom-4 w-px bg-muted"></div>
        
        {blocks.map((block) => (
          <div key={block.id} className="flex items-start gap-4 relative group min-h-[3.5rem]">
            {/* Time */}
            <div className="w-16 shrink-0 text-right pt-2">
              <span className="text-xs font-medium text-muted-foreground">{formatHour(block.hour)}</span>
            </div>
            
            {/* Timeline Dot */}
            <div className="relative pt-3 shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full z-10 relative transition-colors ${block.label ? 'bg-primary' : 'bg-muted border border-card'}`}></div>
            </div>
            
            {/* Input Area */}
            <div className="flex-1 pt-1 pb-2">
              <div className={`transition-all duration-200 rounded-lg p-2 ${block.label ? 'bg-accent/50' : 'hover:bg-accent/30'}`}>
                <input
                  type="text"
                  value={block.label}
                  onChange={(e) => updateBlockLabel(block.id, e.target.value)}
                  placeholder="Click to add event..."
                  className="w-full bg-transparent border-none text-sm text-card-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
