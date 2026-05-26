import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "@/hooks/use-toast";
import {
  usePomodoroTimer,
  type PomodoroTimerApi,
} from "@/hooks/use-pomodoro-timer";
import { getDayData, getPomodoroSettings, getSelectedDate } from "@/lib/storage";
import { phaseLabel } from "@/lib/pomodoro";
import { playPhaseCompleteChime } from "@/lib/pomodoro-sound";
import { PomodoroFocusOverlay } from "@/components/pomodoro/PomodoroFocusOverlay";

type PomodoroContextValue = PomodoroTimerApi & {
  overlayOpen: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
  mainFocusText: string;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

const DEFAULT_TITLE = "Weekly Planner";

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const titleRef = useRef(DEFAULT_TITLE);

  useEffect(() => {
    titleRef.current = document.title || DEFAULT_TITLE;
  }, []);

  const timer = usePomodoroTimer({
    onPhaseComplete: (phase, nextPhase) => {
      if (getPomodoroSettings().soundEnabled) {
        playPhaseCompleteChime();
      }
      toast({
        title: `${phaseLabel(phase)} complete`,
        description:
          phase === "focus"
            ? "Time for a break — choose short or long when you're ready."
            : nextPhase === "focus"
              ? "Time to focus again."
              : `Up next: ${phaseLabel(nextPhase).toLowerCase()}.`,
      });
    },
  });

  const mainFocusText = useMemo(() => {
    const day = getDayData(getSelectedDate());
    const focus = day.mainFocus?.trim();
    return focus ?? "";
  }, [overlayOpen, timer.status, timer.phase]);

  const openOverlay = useCallback(() => {
    timer.refreshSettings();
    setOverlayOpen(true);
  }, [timer]);

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    if (timer.status === "running") {
      timer.pause();
    }
  }, [timer]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const base = titleRef.current;

    if (timer.status === "running") {
      document.title = `${timer.countdownLabel} · ${timer.phaseTitle}`;
      return () => {
        document.title = base;
      };
    }

    document.title = base;
    return;
  }, [timer.status, timer.countdownLabel, timer.phaseTitle]);

  const value = useMemo(
    (): PomodoroContextValue => ({
      ...timer,
      overlayOpen,
      openOverlay,
      closeOverlay,
      mainFocusText,
    }),
    [timer, overlayOpen, openOverlay, closeOverlay, mainFocusText],
  );

  return (
    <PomodoroContext.Provider value={value}>
      {children}
      {overlayOpen && (
        <PomodoroFocusOverlay
          onExit={closeOverlay}
          mainFocusText={mainFocusText}
        />
      )}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error("usePomodoro must be used within PomodoroProvider");
  }
  return ctx;
}
