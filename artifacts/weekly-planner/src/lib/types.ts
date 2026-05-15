export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  /** Minutes from midnight; aligned to 30-minute grid (e.g. 6:00 AM = 360). */
  startMinute: number;
  /** Length in minutes; at least 30, in 30-minute steps. */
  durationMinutes: number;
  label: string;
}

export type HabitKind = "boolean" | "quantifiable";

export interface HabitDefinition {
  id: string;
  name: string;
  kind: HabitKind;
  /** e.g. "steps", "glasses", "hours" — set in settings for quantifiable habits */
  unit?: string;
  createdAt: string;
  /** Daily goal for quantifiable habits (set in settings). */
  target?: number;
}

export interface HabitDayLog {
  completed?: boolean;
  /** Daily goal (quantifiable habits) */
  goal?: number;
  /** Daily actual (quantifiable habits) */
  actual?: number;
  /** @deprecated Legacy; use `actual` */
  value?: number;
}

export interface DayData {
  mainFocus: string;
  mainFocusCompleted: boolean;
  highPriorityTasks: Task[];
  generalTasks: Task[];
  timeBlocks: TimeBlock[];
  meals: { breakfast: string; lunch: string; dinner: string };
  gratitude: string[];
  brainDump: string;
  habitLogs: Record<string, HabitDayLog>;
}

export interface PlannerData {
  days: Record<string, DayData>;
  habits?: HabitDefinition[];
}

export const defaultDayData: DayData = {
  mainFocus: '',
  mainFocusCompleted: false,
  highPriorityTasks: [],
  generalTasks: [],
  timeBlocks: [],
  meals: { breakfast: '', lunch: '', dinner: '' },
  gratitude: ['', '', ''],
  brainDump: '',
  habitLogs: {},
};

export const MAX_HABITS = 12;
export const MAX_HABIT_NAME_LENGTH = 80;
