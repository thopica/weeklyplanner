import { Link } from "wouter";
import type { ActionableInsight } from "@/lib/insight-messages";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: ActionableInsight;
}

const toneAccent: Record<ActionableInsight["tone"], string> = {
  celebrate: "bg-primary/5",
  neutral: "planner-card-surface",
  nudge: "bg-surface-subtle",
};

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border px-4 py-3",
        toneAccent[insight.tone],
      )}
      data-testid={`insight-card-${insight.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="type-ui font-semibold text-foreground">{insight.title}</h3>
        {insight.metric ? (
          <span className="type-meta shrink-0 font-semibold tabular-nums text-primary">
            {insight.metric}
          </span>
        ) : null}
      </div>
      <p className="type-ui mt-1.5 leading-snug text-muted-foreground">{insight.body}</p>
      {insight.href && insight.hrefLabel ? (
        <Link
          href={insight.href}
          className="type-caption mt-2 inline-block font-semibold text-primary underline-offset-2 hover:underline"
        >
          {insight.hrefLabel}
        </Link>
      ) : null}
    </article>
  );
}

export function InsightCardGrid({ insights }: { insights: ActionableInsight[] }) {
  if (insights.length === 0) return null;
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        insights.length === 3 && "lg:grid-cols-3",
      )}
      data-testid="insight-card-grid"
    >
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
