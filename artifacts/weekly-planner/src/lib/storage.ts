import { format } from 'date-fns';
import { PlannerData, DayData, defaultDayData } from './types';

export const STORAGE_KEYS = {
  PLANNER_DATA: 'weeklyPlanner_data',
  THEME: 'weeklyPlanner_theme',
  SELECTED_DATE: 'weeklyPlanner_selectedDate',
};

export function getPlannerData(): PlannerData {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLANNER_DATA);
    return data ? JSON.parse(data) : { days: {} };
  } catch (e) {
    console.error("Failed to parse planner data", e);
    return { days: {} };
  }
}

export function savePlannerData(data: PlannerData): void {
  localStorage.setItem(STORAGE_KEYS.PLANNER_DATA, JSON.stringify(data));
}

export function getDayData(dateStr: string): DayData {
  const data = getPlannerData();
  return data.days[dateStr] || structuredClone(defaultDayData);
}

export function saveDayData(dateStr: string, dayData: DayData): void {
  const data = getPlannerData();
  data.days[dateStr] = dayData;
  savePlannerData(data);
}

export function getTheme(): string {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'theme-boho';
}

export function saveTheme(theme: string): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  document.documentElement.className = theme;
}

/** Returns today's date as YYYY-MM-DD, timezone-safe. */
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getSelectedDate(): string {
  const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_DATE);
  if (stored) return stored;
  const today = todayStr();
  saveSelectedDate(today);
  return today;
}

export function saveSelectedDate(dateStr: string): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_DATE, dateStr);
}

export function loadDemoData(dateStr: string): void {
  const data = getPlannerData();
  data.days[dateStr] = {
    mainFocus: "Finish the creative brief for client project",
    highPriorityTasks: [
      { id: "hp1", text: "Draft proposal outline", completed: true, createdAt: new Date().toISOString() },
      { id: "hp2", text: "Review feedback with team", completed: false, createdAt: new Date().toISOString() },
      { id: "hp3", text: "Send final invoice", completed: false, createdAt: new Date().toISOString() },
    ],
    generalTasks: [
      { id: "g1", text: "Reply to Sarah's email", completed: true, createdAt: new Date().toISOString() },
      { id: "g2", text: "Order new notebook", completed: true, createdAt: new Date().toISOString() },
      { id: "g3", text: "Water the plants", completed: false, createdAt: new Date().toISOString() },
      { id: "g4", text: "Schedule dentist appointment", completed: false, createdAt: new Date().toISOString() },
      { id: "g5", text: "Clean inbox", completed: false, createdAt: new Date().toISOString() },
    ],
    timeBlocks: Array.from({ length: 17 }, (_, i) => ({
      id: `block-${i + 6}`,
      hour: i + 6,
      label:
        i + 6 === 8 ? "Morning Routine & Coffee" :
        i + 6 === 10 ? "Deep Work: Proposal" :
        i + 6 === 13 ? "Lunch Break" :
        i + 6 === 15 ? "Team Check-in" :
        i + 6 === 19 ? "Evening Wind Down" : "",
    })),
    waterGlasses: 3,
    meals: { breakfast: "Oatmeal with berries", lunch: "Salad bowl", dinner: "Pasta" },
    gratitude: ["Sunshine today", "Good coffee", "Finishing a big task"],
    brainDump: "Need to remember to call Mom this weekend. Also, look up recipes for the dinner party on Friday.",
  };
  savePlannerData(data);
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PLANNER_DATA);
}
