import { useEffect, useRef, useState } from "react";
import { formatCountdown, parseCountdownInput } from "@/lib/pomodoro";
import { cn } from "@/lib/utils";

interface PomodoroCountdownEditorProps {
  remainingSeconds: number;
  canEdit: boolean;
  onCommit: (totalSeconds: number) => void;
  className?: string;
}

export function PomodoroCountdownEditor({
  remainingSeconds,
  canEdit,
  onCommit,
  className,
}: PomodoroCountdownEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => formatCountdown(remainingSeconds));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(formatCountdown(remainingSeconds));
    }
  }, [remainingSeconds, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const parsed = parseCountdownInput(draft);
    if (parsed !== null) {
      onCommit(parsed);
    } else {
      setDraft(formatCountdown(remainingSeconds));
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(formatCountdown(remainingSeconds));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        aria-label="Edit timer duration"
        data-testid="pomodoro-countdown-input"
        placeholder="25:00 or 2:00:00"
        className={cn(
          "min-w-[9ch] border-b-2 border-primary bg-transparent px-1 text-center font-serif text-6xl font-semibold tabular-nums tracking-tight outline-none sm:text-7xl",
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={!canEdit}
      onClick={() => canEdit && setEditing(true)}
      data-testid="pomodoro-countdown"
      aria-label={
        canEdit
          ? `Timer ${formatCountdown(remainingSeconds)}, tap to edit`
          : `Timer ${formatCountdown(remainingSeconds)}`
      }
      className={cn(
        "font-serif text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl",
        canEdit &&
          "cursor-pointer rounded-lg transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !canEdit && "cursor-default",
        className,
      )}
    >
      {formatCountdown(remainingSeconds)}
    </button>
  );
}
