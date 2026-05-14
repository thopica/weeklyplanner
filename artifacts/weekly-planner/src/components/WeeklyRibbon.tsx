import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";

interface WeeklyRibbonProps {
  selectedDate: Date;
  onSelectDate: (dateStr: string) => void;
}

export function WeeklyRibbon({ selectedDate, onSelectDate }: WeeklyRibbonProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex justify-between items-center bg-card rounded-2xl p-2 md:p-4 shadow-sm border border-card-border mb-8 overflow-x-auto gap-2 scrollbar-hide">
      {days.map((date) => {
        const isActive = isSameDay(date, selectedDate);
        return (
          <button
            key={date.toISOString()}
            onClick={() => onSelectDate(date.toISOString().split('T')[0])}
            className={`flex flex-col items-center justify-center min-w-[3.5rem] md:min-w-[4.5rem] py-2 px-1 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <span className="text-xs md:text-sm font-medium uppercase tracking-wider mb-1">
              {format(date, "EEE")}
            </span>
            <span className={`text-lg md:text-xl font-serif ${isActive ? 'font-bold' : ''}`}>
              {format(date, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
