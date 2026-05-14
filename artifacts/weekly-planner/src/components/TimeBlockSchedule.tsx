import { TimeBlock } from "@/lib/types";

interface TimeBlockScheduleProps {
  blocks: TimeBlock[];
  onChange: (blocks: TimeBlock[]) => void;
}

export function TimeBlockSchedule({ blocks, onChange }: TimeBlockScheduleProps) {
  const updateBlockLabel = (id: string, label: string) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, label } : b)));
  };

  const formatHour = (hour: number) => {
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <div
      className="flex flex-col h-full"
      data-testid="time-block-schedule"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
        <div className="relative">
          {/* Vertical timeline line */}
          <div
            className="absolute left-[52px] top-4 bottom-0 w-px"
            style={{ background: "hsl(var(--border))" }}
          />

          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-start gap-3 group min-h-[44px] relative"
            >
              {/* Time label */}
              <span className="w-12 shrink-0 text-right text-[10px] font-bold text-muted-foreground pt-2 tabular-nums">
                {formatHour(block.hour)}
              </span>

              {/* Timeline dot */}
              <div className="flex flex-col items-center shrink-0 mt-2.5 z-10">
                <div
                  className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                  style={{
                    background: block.label
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))",
                    boxShadow: block.label
                      ? "0 0 0 3px hsl(var(--primary) / 0.15)"
                      : "none",
                  }}
                />
              </div>

              {/* Input */}
              <div className="flex-1 pb-2 pt-0.5">
                <div
                  className="rounded-xl px-3 py-1.5 transition-all duration-200"
                  style={{
                    background: block.label ? "hsl(var(--accent))" : "transparent",
                  }}
                >
                  <input
                    type="text"
                    value={block.label}
                    onChange={(e) => updateBlockLabel(block.id, e.target.value)}
                    placeholder="Add event..."
                    data-testid={`time-block-${block.hour}`}
                    className="w-full bg-transparent border-none text-sm text-card-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                    style={{
                      color: block.label
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
