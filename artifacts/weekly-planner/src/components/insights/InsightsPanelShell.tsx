import type { ReactNode } from "react";

interface InsightsPanelShellProps {
  headingId: string;
  title: string;
  description: string;
  testId?: string;
  children: ReactNode;
}

export function InsightsPanelShell({
  headingId,
  title,
  description,
  testId,
  children,
}: InsightsPanelShellProps) {
  return (
    <section
      className="planner-card-surface overflow-hidden rounded-xl border border-border"
      aria-labelledby={headingId}
      data-testid={testId}
    >
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <h2 id={headingId} className="type-section-title text-foreground">
          {title}
        </h2>
        <p className="type-section-desc mt-0.5 text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}
