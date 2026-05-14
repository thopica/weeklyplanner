import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { getDayData } from "@/lib/storage";

interface WeeklyOverviewProps {
  selectedDateStr: string;
}

export function WeeklyOverview({ selectedDateStr }: WeeklyOverviewProps) {
  const selectedDate = new Date(selectedDateStr);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-card-border mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">Weekly Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {days.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const data = getDayData(dateStr);
          const allTasks = [...data.highPriorityTasks, ...data.generalTasks];
          const completedTasks = allTasks.filter(t => t.completed).length;
          const totalTasks = allTasks.length;
          const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
          
          return (
            <div key={dateStr} className={`p-4 rounded-xl border ${isSameDay(date, selectedDate) ? 'border-primary bg-primary/5' : 'border-card-border bg-background/50'}`}>
              <div className="text-center mb-3">
                <div className="text-xs font-medium uppercase text-muted-foreground mb-1">{format(date, "EEE")}</div>
                <div className="text-xl font-serif text-foreground">{format(date, "d")}</div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Tasks</span>
                    <span className="font-medium text-foreground">{completedTasks}/{totalTasks}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-1 justify-center">
                  <div className="text-xs text-muted-foreground">Drop:</div>
                  <div className="text-xs font-medium text-primary">{data.waterGlasses}/8</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
