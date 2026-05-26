import { useEffect } from "react";
import { X, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePomodoro } from "@/components/pomodoro/PomodoroProvider";
import { PomodoroCountdownEditor } from "@/components/pomodoro/PomodoroCountdownEditor";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { phaseLabel, type PomodoroPhase } from "@/lib/pomodoro";
import { tasteTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import pomodoroMascot from "@/assets/pomodoro-mascot.png";

const RING_SIZE = 280;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PHASES: { id: PomodoroPhase; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "shortBreak", label: "Short break" },
  { id: "longBreak", label: "Long break" },
];

interface PomodoroFocusOverlayProps {
  onExit: () => void;
  mainFocusText: string;
}

export function PomodoroFocusOverlay({
  onExit,
  mainFocusText,
}: PomodoroFocusOverlayProps) {
  const reduceMotion = useReducedMotion();
  const {
    phase,
    status,
    progress,
    interstitial,
    remainingSeconds,
    canEditDuration,
    canSelectPhase,
    playButtonLabel,
    togglePlayPause,
    selectPhase,
    setSessionDuration,
    chooseBreak,
    skipInterstitial,
    resetSession,
  } = usePomodoro();

  const breakChoice = interstitial?.kind === "breakChoice";
  const upNext = interstitial?.kind === "upNext" ? interstitial : null;

  const phaseTitle = breakChoice
    ? "Time for a break"
    : upNext
      ? `Up next: ${phaseLabel(upNext.nextPhase)}`
      : phaseLabel(phase);

  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const urgent =
    !breakChoice &&
    !upNext &&
    status === "running" &&
    remainingSeconds > 0 &&
    remainingSeconds <= 10;

  const overlayRef = useFocusTrap(true, onExit);
  const mainFocusId = "pomodoro-main-focus";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-100 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pomodoro-focus-title"
      aria-describedby={mainFocusText && phase === "focus" && !breakChoice && !upNext ? mainFocusId : undefined}
      data-testid="pomodoro-overlay"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                scale: phase === "focus" ? [1, 1.04, 1] : 1,
              }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <PhaseGradient phase={phase} />
      </motion.div>

      <header className="relative z-10 flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-10 w-10 rounded-full bg-card/80 shadow-sm backdrop-blur-sm"
          aria-label="Exit focus mode"
          data-testid="button-pomodoro-exit"
        >
          <X className="h-5 w-5" />
        </Button>
        <span aria-hidden />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <motion.img
          src={pomodoroMascot}
          alt=""
          aria-hidden
          className="mb-6 h-24 w-24 object-contain sm:h-28 sm:w-28"
          animate={
            reduceMotion
              ? undefined
              : { y: phase === "focus" && status === "running" ? [0, -6, 0] : 0 }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
          }
        />

        {!breakChoice && (
        <motion.div
          className="mb-6 flex w-full max-w-md rounded-full border border-border bg-card/60 p-1 backdrop-blur-sm"
          role="tablist"
          aria-label="Pomodoro phase"
        >
          {PHASES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={phase === id}
              disabled={!canSelectPhase}
              onClick={() => selectPhase(id)}
              data-testid={`pomodoro-tab-${id}`}
              className={cn(
                "flex-1 rounded-full px-2 py-2 text-center text-xs font-medium transition-colors sm:text-sm",
                phase === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                !canSelectPhase && "cursor-not-allowed opacity-60",
              )}
            >
              {label}
            </button>
          ))}
        </motion.div>
        )}

        {!breakChoice && !canSelectPhase && status === "running" && (
          <p className="type-caption -mt-4 mb-4 text-muted-foreground">
            Pause to switch phase or edit time
          </p>
        )}

        <motion.p
          id="pomodoro-focus-title"
          key={phaseTitle}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tasteTransition(reduceMotion, { duration: 0.25 })}
          className="type-section-title mb-2 text-center text-muted-foreground"
        >
          {phaseTitle}
        </motion.p>

        {breakChoice && (
          <p className="type-ui mb-6 max-w-sm text-center text-foreground/80">
            Choose a break type, then press Start when you&apos;re ready.
          </p>
        )}

        {mainFocusText && phase === "focus" && !breakChoice && !upNext && (
          <p
            id={mainFocusId}
            className="type-ui mb-6 max-w-md text-center text-foreground/80"
          >
            Today&apos;s focus: {mainFocusText}
          </p>
        )}

        <div className="relative flex flex-col items-center justify-center">
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className={cn(
              "-rotate-90",
              urgent && !reduceMotion && "animate-pulse",
            )}
            aria-hidden
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              className="text-muted/30"
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className={cn(
                "transition-[stroke-dashoffset] duration-300",
                phase === "focus" && "text-primary",
                phase === "shortBreak" && "text-secondary",
                phase === "longBreak" && "text-accent-foreground",
              )}
            />
          </svg>
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            aria-live="polite"
          >
            {breakChoice ? (
              <span className="max-w-[14rem] text-center font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:max-w-none sm:text-4xl">
                Time for a break
              </span>
            ) : upNext ? (
              <span className="font-serif text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
                {upNext.secondsLeft}
              </span>
            ) : (
              <>
                <PomodoroCountdownEditor
                  remainingSeconds={remainingSeconds}
                  canEdit={canEditDuration}
                  onCommit={(seconds) => setSessionDuration(phase, seconds)}
                />
                {canEditDuration && (
                  <span className="type-caption text-muted-foreground">
                    Tap to edit (up to 4 hours)
                  </span>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 flex shrink-0 flex-wrap items-center justify-center gap-2 px-4 pb-8 sm:gap-3">
        {breakChoice ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => chooseBreak("shortBreak")}
              data-testid="button-pomodoro-short-break"
              className="min-w-36"
            >
              Short break
            </Button>
            <Button
              type="button"
              onClick={() => chooseBreak("longBreak")}
              data-testid="button-pomodoro-long-break"
              className="min-w-36"
            >
              Long break
            </Button>
          </>
        ) : upNext ? (
          <Button type="button" onClick={skipInterstitial} className="min-w-40">
            Start now
            <SkipForward className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant={status === "running" ? "secondary" : "default"}
              onClick={togglePlayPause}
              data-testid="button-pomodoro-play-pause"
              className="min-w-32"
            >
              {status === "running" ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  {playButtonLabel}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {playButtonLabel}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetSession}
              className="text-muted-foreground"
              data-testid="button-pomodoro-reset"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </>
        )}
      </footer>
    </motion.div>
  );
}

function PhaseGradient({ phase }: { phase: PomodoroPhase }) {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl",
        phase === "focus" && "bg-primary/25",
        phase === "shortBreak" && "bg-secondary/20",
        phase === "longBreak" && "bg-accent/25",
      )}
    />
  );
}

function motionSpacer() {
  return <div className="w-10" aria-hidden />;
}
