import { Droplets } from "lucide-react";
import { motion } from "framer-motion";

interface WaterTrackerProps {
  count: number;
  onChange: (count: number) => void;
}

export function WaterTracker({ count, onChange }: WaterTrackerProps) {
  const maxGlasses = 8;
  
  const toggleGlass = (index: number) => {
    // If clicking the currently highest filled glass, unfill it
    if (index === count - 1) {
      onChange(index);
    } else {
      // Otherwise fill up to the clicked glass
      onChange(index + 1);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-card-border mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Hydration</h2>
        <span className="text-xs font-medium text-muted-foreground">{count} / {maxGlasses}</span>
      </div>
      
      <div className="flex justify-between items-center gap-1">
        {Array.from({ length: maxGlasses }).map((_, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.8 }}
            onClick={() => toggleGlass(i)}
            className="focus:outline-none"
          >
            <Droplets 
              className={`w-6 h-6 md:w-8 md:h-8 transition-colors duration-500 ${
                i < count 
                  ? "fill-primary text-primary" 
                  : "fill-transparent text-muted stroke-[1.5px]"
              }`} 
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
