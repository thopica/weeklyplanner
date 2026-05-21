"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { plannerStepBadgeClassName } from "@/components/PlannerSection";
import { guideStaggerChild } from "@/components/guide/guide-motion";

interface GuideSectionProps {
  title: string;
  description?: string;
  variant?: "default" | "emphasis";
  children: ReactNode;
  className?: string;
}

export function GuideSection({
  title,
  description,
  variant = "default",
  children,
  className,
}: GuideSectionProps) {
  const isEmphasis = variant === "emphasis";

  return (
    <motion.section
      variants={guideStaggerChild}
      className={cn(
        "planner-card-surface scroll-mt-4 overflow-hidden rounded-xl border border-border",
        isEmphasis && "border-primary/20",
        className,
      )}
    >
      <div className={cn("px-4 py-4 sm:px-5 sm:py-5", isEmphasis && "border-l-[3px] border-l-primary/50")}>
        <header className="mb-4">
          <h2 className="type-section-title">{title}</h2>
          {description ? <p className="type-section-desc mt-1">{description}</p> : null}
        </header>
        <div className="space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </motion.section>
  );
}

export function GuideSubheading({ children }: { children: ReactNode }) {
  return <h3 className="type-ui font-semibold text-foreground">{children}</h3>;
}

export function GuideParagraph({ children }: { children: ReactNode }) {
  return <p className="type-body leading-relaxed">{children}</p>;
}

export function GuideList({ children }: { children: ReactNode }) {
  return <ul className="type-body list-disc space-y-2 pl-5">{children}</ul>;
}

export function GuideOrderedList({ children }: { children: ReactNode }) {
  return <ol className="type-body list-decimal space-y-2 pl-5">{children}</ol>;
}

export function GuideStepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex items-start gap-3">
          <span className={plannerStepBadgeClassName} aria-hidden>
            {index + 1}
          </span>
          <span className="type-body min-w-0 flex-1 pt-0.5 leading-relaxed text-muted-foreground">
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

const calloutSurface =
  "rounded-lg border px-3.5 py-3 text-sm leading-relaxed shadow-[inset_0_1px_0_hsl(var(--card)/0.65)]";

export function GuideTip({ children }: { children: ReactNode }) {
  return (
    <p
      className={cn(
        calloutSurface,
        "border-border/80 bg-surface-subtle/70 text-foreground",
      )}
    >
      {children}
    </p>
  );
}

export function GuideWarning({ children }: { children: ReactNode }) {
  return (
    <p
      className={cn(
        calloutSurface,
        "border-destructive/30 bg-destructive/5 text-foreground",
      )}
    >
      {children}
    </p>
  );
}

interface GuideTableProps {
  headers: string[];
  rows: ReactNode[][];
}

export function GuideTable({ headers, rows }: GuideTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-[0_8px_20px_-16px_hsl(var(--foreground)/0.15)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {headers.map((header) => (
              <th
                key={header}
                className="type-ui px-3 py-2.5 font-semibold text-foreground first:rounded-tl-lg last:rounded-tr-lg"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="type-body px-3 py-2.5 align-top text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuideDataLossItem({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/90 bg-background/80 p-4 transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-[0_10px_24px_-20px_hsl(var(--foreground)/0.2)] motion-reduce:hover:shadow-none">
      <div className="flex items-start gap-3">
        <span className={plannerStepBadgeClassName} aria-hidden>
          {number}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="type-ui font-semibold text-foreground">{title}</h3>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}
