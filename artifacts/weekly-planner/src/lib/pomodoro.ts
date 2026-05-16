export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

export type PomodoroSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLong: number;
  soundEnabled: boolean;
};

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
  soundEnabled: true,
};

const MIN_MINUTES = 1;
const MAX_MINUTES = 90;
const MIN_SESSIONS = 2;
const MAX_SESSIONS = 8;

export function clampPomodoroMinutes(value: number): number {
  if (!Number.isFinite(value)) return MIN_MINUTES;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

export function clampSessionsBeforeLong(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POMODORO_SETTINGS.sessionsBeforeLong;
  return Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, Math.round(value)));
}

export function normalizePomodoroSettings(
  raw: Partial<PomodoroSettings> | null | undefined,
): PomodoroSettings {
  return {
    focusMinutes: clampPomodoroMinutes(
      raw?.focusMinutes ?? DEFAULT_POMODORO_SETTINGS.focusMinutes,
    ),
    shortBreakMinutes: clampPomodoroMinutes(
      raw?.shortBreakMinutes ?? DEFAULT_POMODORO_SETTINGS.shortBreakMinutes,
    ),
    longBreakMinutes: clampPomodoroMinutes(
      raw?.longBreakMinutes ?? DEFAULT_POMODORO_SETTINGS.longBreakMinutes,
    ),
    sessionsBeforeLong: clampSessionsBeforeLong(
      raw?.sessionsBeforeLong ?? DEFAULT_POMODORO_SETTINGS.sessionsBeforeLong,
    ),
    soundEnabled:
      typeof raw?.soundEnabled === "boolean"
        ? raw.soundEnabled
        : DEFAULT_POMODORO_SETTINGS.soundEnabled,
  };
}

export function phaseDurationSeconds(
  phase: PomodoroPhase,
  settings: PomodoroSettings,
): number {
  switch (phase) {
    case "focus":
      return settings.focusMinutes * 60;
    case "shortBreak":
      return settings.shortBreakMinutes * 60;
    case "longBreak":
      return settings.longBreakMinutes * 60;
  }
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const MIN_SESSION_SECONDS = 60;
const MAX_SESSION_SECONDS = MAX_MINUTES * 60;

export function clampSessionSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return MIN_SESSION_SECONDS;
  return Math.min(
    MAX_SESSION_SECONDS,
    Math.max(MIN_SESSION_SECONDS, Math.round(seconds)),
  );
}

/** Parse MM:SS or M:SS input into total seconds, or null if invalid. */
export function parseCountdownInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (seconds > 59) return null;
  const total = minutes * 60 + seconds;
  if (total < MIN_SESSION_SECONDS || total > MAX_SESSION_SECONDS) return null;
  return total;
}

export function phaseLabel(phase: PomodoroPhase): string {
  switch (phase) {
    case "focus":
      return "Focus";
    case "shortBreak":
      return "Short break";
    case "longBreak":
      return "Long break";
  }
}

/** Next phase after the current one completes. */
export function nextPhaseAfter(
  phase: PomodoroPhase,
  completedFocusSessions: number,
  settings: PomodoroSettings,
): PomodoroPhase {
  if (phase === "focus") {
    const nextSessionNumber = completedFocusSessions + 1;
    if (
      nextSessionNumber > 0 &&
      nextSessionNumber % settings.sessionsBeforeLong === 0
    ) {
      return "longBreak";
    }
    return "shortBreak";
  }
  return "focus";
}
