import type { ActionableInsight } from "@/lib/insight-messages";
import { FinishRateRing } from "@/components/insights/FinishRateRing";
import { cn } from "@/lib/utils";

interface InsightsHeroProps {
  hero: ActionableInsight | null;
  finishRate: number | null;
  periodDays: number;
  hasEnoughData: boolean;
}

export function InsightsHero({
  hero,
  finishRate,
  periodDays,
  hasEnoughData,
}: InsightsHeroProps) {
  const title = hero?.title ?? "Your insights";
  const body =
    hero?.body ??
    (hasEnoughData
      ? `A snapshot of the last ${periodDays} days.`
      : `Keep planning for a few more days to unlock personalized insights.`);

  return (
    <div
      className={cn(
        "planner-card-surface flex flex-col gap-4 rounded-xl border border-border p-5 sm:flex-row sm:items-center sm:justify-between",
        hero?.tone === "celebrate" && "bg-primary/5",
      )}
      data-testid="insights-hero"
    >
      <div className="min-w-0 flex-1">
        <h2 className="type-section-title font-serif text-foreground">{title}</h2>
        <p className="type-ui mt-2 max-w-prose leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {finishRate !== null ? (
        <FinishRateRing value={finishRate} size={80} className="mx-auto sm:mx-0" />
      ) : null}
    </div>
  );
}
