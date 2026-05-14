import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSelectedDate, saveSelectedDate, getDayData, saveDayData, getPlannerData } from "@/lib/storage";
import { DayData } from "@/lib/types";
import { WeeklyRibbon } from "@/components/WeeklyRibbon";
import { MainFocusSection } from "@/components/MainFocusSection";
import { TaskList } from "@/components/TaskList";
import { TimeBlockSchedule } from "@/components/TimeBlockSchedule";
import { WaterTracker } from "@/components/WaterTracker";
import { MealPlan } from "@/components/MealPlan";
import { GratitudeSection } from "@/components/GratitudeSection";
import { BrainDump } from "@/components/BrainDump";
import { SettingsPanel } from "@/components/SettingsPanel";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getSelectedDate());
  const [dayData, setDayData] = useState<DayData | null>(null);
  
  const loadData = () => {
    setDayData(getDayData(selectedDateStr));
  };

  useEffect(() => {
    saveSelectedDate(selectedDateStr);
    loadData();
  }, [selectedDateStr]);

  if (!dayData) return null;

  const handleDataChange = (newData: DayData) => {
    setDayData(newData);
    saveDayData(selectedDateStr, newData);
  };

  const selectedDate = parseISO(selectedDateStr);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col font-sans transition-colors duration-500">
      <header className="px-6 py-6 md:px-10 max-w-[1400px] mx-auto w-full flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-foreground font-medium tracking-tight">
            {format(selectedDate, "EEEE, MMMM do")}
          </h1>
        </div>
        <SettingsPanel 
          trigger={
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-10 w-10">
              <Settings className="w-5 h-5" />
            </Button>
          }
          selectedDateStr={selectedDateStr}
          onDataReset={loadData}
        />
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 md:px-10 pb-20">
        <WeeklyRibbon 
          selectedDate={selectedDate} 
          onSelectDate={setSelectedDateStr} 
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDateStr}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Tasks & Focus */}
            <div className="lg:col-span-5 flex flex-col">
              <MainFocusSection 
                focus={dayData.mainFocus} 
                onChange={(focus) => handleDataChange({ ...dayData, mainFocus: focus })} 
              />
              
              <TaskList 
                title="High Priority" 
                tasks={dayData.highPriorityTasks} 
                onChange={(tasks) => handleDataChange({ ...dayData, highPriorityTasks: tasks })}
                accentColor="primary"
              />
              
              <TaskList 
                title="General Tasks" 
                tasks={dayData.generalTasks} 
                onChange={(tasks) => handleDataChange({ ...dayData, generalTasks: tasks })}
                accentColor="secondary"
              />
            </div>

            {/* Center Column: Schedule */}
            <div className="lg:col-span-4">
              <TimeBlockSchedule 
                blocks={dayData.timeBlocks} 
                onChange={(blocks) => handleDataChange({ ...dayData, timeBlocks: blocks })} 
              />
            </div>

            {/* Right Column: Wellness & Notes */}
            <div className="lg:col-span-3 flex flex-col">
              <WaterTracker 
                count={dayData.waterGlasses} 
                onChange={(count) => handleDataChange({ ...dayData, waterGlasses: count })} 
              />
              
              <MealPlan 
                meals={dayData.meals} 
                onChange={(meals) => handleDataChange({ ...dayData, meals: meals })} 
              />
              
              <GratitudeSection 
                items={dayData.gratitude} 
                onChange={(items) => handleDataChange({ ...dayData, gratitude: items })} 
              />
              
              <div className="flex-1">
                <BrainDump 
                  text={dayData.brainDump} 
                  onChange={(text) => handleDataChange({ ...dayData, brainDump: text })} 
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
