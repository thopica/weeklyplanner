export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  hour: number; // 6-22
  label: string;
}

export interface DayData {
  mainFocus: string;
  highPriorityTasks: Task[];
  generalTasks: Task[];
  timeBlocks: TimeBlock[];
  waterGlasses: number; // 0-8
  meals: { breakfast: string; lunch: string; dinner: string };
  gratitude: string[]; // 3 items
  brainDump: string;
}

export interface PlannerData {
  days: Record<string, DayData>; // "YYYY-MM-DD" -> DayData
}

export const defaultDayData: DayData = {
  mainFocus: '',
  highPriorityTasks: [],
  generalTasks: [],
  timeBlocks: Array.from({ length: 17 }, (_, i) => ({
    id: `block-${i + 6}`,
    hour: i + 6,
    label: '',
  })),
  waterGlasses: 0,
  meals: { breakfast: '', lunch: '', dinner: '' },
  gratitude: ['', '', ''],
  brainDump: '',
};
