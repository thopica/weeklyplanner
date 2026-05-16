import { Button } from "@/components/ui/button";
import { usePomodoro } from "@/components/pomodoro/PomodoroProvider";
import { cn } from "@/lib/utils";
import pomodoroMascot from "@/assets/pomodoro-mascot.png";

export function PomodoroHeaderButton() {
  const { openOverlay, status } = usePomodoro();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={openOverlay}
      data-testid="button-pomodoro"
      aria-label="Open Pomodoro timer"
      className={cn(
        "relative h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground",
        status === "running" && "ring-2 ring-primary/30",
      )}
    >
      <img
        src={pomodoroMascot}
        alt=""
        aria-hidden
        className="h-6 w-6 object-contain motion-safe:transition-transform motion-safe:hover:scale-105"
      />
      {status === "running" && (
        <span
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card"
          aria-hidden
        />
      )}
    </Button>
  );
}
