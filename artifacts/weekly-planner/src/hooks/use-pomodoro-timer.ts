import { useCallback, useEffect, useRef, useState } from "react";
import { getPomodoroSettings } from "@/lib/storage";
import {
  clampSessionSeconds,
  formatCountdown,
  nextPhaseAfter,
  phaseDurationSeconds,
  phaseLabel,
  type PomodoroPhase,
  type PomodoroSettings,
} from "@/lib/pomodoro";

export type PomodoroStatus = "idle" | "running" | "paused";

export type PomodoroInterstitial = {
  nextPhase: PomodoroPhase;
  secondsLeft: number;
} | null;

export type SessionDurations = Partial<Record<PomodoroPhase, number>>;

export type UsePomodoroTimerOptions = {
  onPhaseComplete?: (phase: PomodoroPhase, nextPhase: PomodoroPhase) => void;
};

export function usePomodoroTimer(options: UsePomodoroTimerOptions = {}) {
  const [settings, setSettings] = useState<PomodoroSettings>(() => getPomodoroSettings());
  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [status, setStatus] = useState<PomodoroStatus>("idle");
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  const [sessionDurations, setSessionDurations] = useState<SessionDurations>({});
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    phaseDurationSeconds("focus", getPomodoroSettings()),
  );
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [interstitial, setInterstitial] = useState<PomodoroInterstitial>(null);
  const onPhaseCompleteRef = useRef(options.onPhaseComplete);
  const completingRef = useRef(false);
  onPhaseCompleteRef.current = options.onPhaseComplete;

  const getPhaseDurationSeconds = useCallback(
    (targetPhase: PomodoroPhase, overrides = sessionDurations) => {
      const override = overrides[targetPhase];
      if (override !== undefined) return override;
      return phaseDurationSeconds(targetPhase, settings);
    },
    [sessionDurations, settings],
  );

  const refreshSettings = useCallback(() => {
    const s = getPomodoroSettings();
    setSettings(s);
    if (status === "idle" && !interstitial) {
      setRemainingSeconds(getPhaseDurationSeconds(phase, sessionDurations));
    }
  }, [status, interstitial, phase, sessionDurations, getPhaseDurationSeconds]);

  const syncRemaining = useCallback(() => {
    if (status !== "running" || endTimestamp === null) return;
    const left = (endTimestamp - Date.now()) / 1000;
    setRemainingSeconds(Math.max(0, left));
  }, [status, endTimestamp]);

  useEffect(() => {
    syncRemaining();
    if (status !== "running") return;
    const id = window.setInterval(syncRemaining, 250);
    return () => window.clearInterval(id);
  }, [status, syncRemaining]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncRemaining();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [syncRemaining]);

  const beginPhase = useCallback(
    (nextPhase: PomodoroPhase, overrides?: SessionDurations) => {
      const durations = overrides ?? sessionDurations;
      const duration = getPhaseDurationSeconds(nextPhase, durations);
      setPhase(nextPhase);
      setStatus("running");
      setEndTimestamp(Date.now() + duration * 1000);
      setRemainingSeconds(duration);
      setInterstitial(null);
    },
    [sessionDurations, getPhaseDurationSeconds],
  );

  const completePhase = useCallback(() => {
    const current = phase;
    let nextCompleted = completedFocusSessions;
    if (current === "focus") {
      nextCompleted = completedFocusSessions + 1;
      setCompletedFocusSessions(nextCompleted);
    }
    const next = nextPhaseAfter(current, nextCompleted, settings);
    onPhaseCompleteRef.current?.(current, next);
    setInterstitial({ nextPhase: next, secondsLeft: 3 });
    setStatus("paused");
    setEndTimestamp(null);
  }, [phase, completedFocusSessions, settings]);

  useEffect(() => {
    if (status !== "running" || endTimestamp === null) return;
    if (remainingSeconds > 0) {
      completingRef.current = false;
      return;
    }
    if (completingRef.current) return;
    completingRef.current = true;
    completePhase();
  }, [status, endTimestamp, remainingSeconds, completePhase]);

  useEffect(() => {
    if (!interstitial) return;
    if (interstitial.secondsLeft <= 0) {
      beginPhase(interstitial.nextPhase);
      return;
    }
    const id = window.setTimeout(() => {
      setInterstitial((prev) =>
        prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null,
      );
    }, 1000);
    return () => window.clearTimeout(id);
  }, [interstitial, beginPhase]);

  const pause = useCallback(() => {
    if (status !== "running" || endTimestamp === null) return;
    const left = Math.max(0, (endTimestamp - Date.now()) / 1000);
    setRemainingSeconds(left);
    setEndTimestamp(null);
    setStatus("paused");
  }, [status, endTimestamp]);

  const startFromRemaining = useCallback(() => {
    if (interstitial) return;
    setStatus("running");
    setEndTimestamp(Date.now() + remainingSeconds * 1000);
  }, [remainingSeconds, interstitial]);

  const togglePlayPause = useCallback(() => {
    if (interstitial) return;
    if (status === "running") {
      pause();
      return;
    }
    if (status === "idle" || status === "paused") {
      startFromRemaining();
    }
  }, [status, interstitial, pause, startFromRemaining]);

  const selectPhase = useCallback(
    (nextPhase: PomodoroPhase) => {
      if (status === "running" || interstitial) return false;
      setPhase(nextPhase);
      setRemainingSeconds(getPhaseDurationSeconds(nextPhase));
      if (status === "idle") {
        setEndTimestamp(null);
      }
      return true;
    },
    [status, interstitial, getPhaseDurationSeconds],
  );

  const setSessionDuration = useCallback(
    (targetPhase: PomodoroPhase, totalSeconds: number) => {
      const clamped = clampSessionSeconds(totalSeconds);
      if (status === "running") {
        pause();
      }
      setSessionDurations((prev) => ({
        ...prev,
        [targetPhase]: clamped,
      }));
      if (targetPhase === phase && !interstitial) {
        setRemainingSeconds(clamped);
        setEndTimestamp(null);
        if (status === "running") {
          setStatus("paused");
        }
      }
    },
    [phase, status, interstitial, pause],
  );

  const skipInterstitial = useCallback(() => {
    if (!interstitial) return;
    beginPhase(interstitial.nextPhase);
  }, [interstitial, beginPhase]);

  const resetSession = useCallback(() => {
    const s = getPomodoroSettings();
    setSettings(s);
    setSessionDurations({});
    setCompletedFocusSessions(0);
    setPhase("focus");
    setStatus("idle");
    setEndTimestamp(null);
    setInterstitial(null);
    setRemainingSeconds(phaseDurationSeconds("focus", s));
  }, []);

  const phaseDurationTotal = getPhaseDurationSeconds(phase);
  const countdownLabel = formatCountdown(remainingSeconds);
  const phaseTitle = phaseLabel(phase);
  const isActive = status === "running" || status === "paused";
  const canEditDuration = (status === "idle" || status === "paused") && !interstitial;
  const canSelectPhase = canEditDuration;

  const progress =
    status === "running" || status === "paused"
      ? 1 - remainingSeconds / phaseDurationTotal
      : 0;

  const playButtonLabel =
    status === "running" ? "Pause" : "Start";

  return {
    settings,
    phase,
    status,
    remainingSeconds,
    countdownLabel,
    phaseTitle,
    interstitial,
    isActive,
    canEditDuration,
    canSelectPhase,
    playButtonLabel,
    progress: Math.min(1, Math.max(0, progress)),
    phaseDurationTotal,
    togglePlayPause,
    pause,
    selectPhase,
    setSessionDuration,
    skipInterstitial,
    resetSession,
    refreshSettings,
    getPhaseDurationSeconds,
  };
}

export type PomodoroTimerApi = ReturnType<typeof usePomodoroTimer>;
