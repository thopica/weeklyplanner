import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PlannerSectionVariant = "emphasis" | "default" | "subtle";

/** @deprecated Use emphasis | default | subtle */
export type PlannerSectionVariantLegacy = "hero" | "default" | "subtle";

export interface PlannerSectionProps {
  id?: string;
  step?: number;
  title: string;
  description?: string;
  variant?: PlannerSectionVariant | PlannerSectionVariantLegacy;
  layout?: "standalone" | "segment";
  segmentDivider?: boolean;
  className?: string;
  children: ReactNode;
  "data-testid"?: string;
  headerEnd?: ReactNode;
}

const titleStyles: Record<PlannerSectionVariant, string> = {
  emphasis: "type-section-title",
  default: "type-section-title",
  subtle: "type-ui font-semibold text-foreground",
};

const descriptionStyles: Record<PlannerSectionVariant, string> = {
  emphasis: "mt-1 type-section-desc",
  default: "mt-0.5 type-section-desc",
  subtle: "mt-0.5 type-section-desc",
};

/** Shared step indicator — same surface on every section, all themes */
export const plannerStepBadgeClassName =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary type-ui font-bold text-primary-foreground";

function normalizeVariant(
  variant: PlannerSectionVariant | PlannerSectionVariantLegacy,
): PlannerSectionVariant {
  if (variant === "hero") return "emphasis";
  return variant as PlannerSectionVariant;
}

export function PlannerSection({
  id,
  step,
  title,
  description,
  variant = "default",
  layout = "standalone",
  segmentDivider = false,
  className,
  children,
  "data-testid": dataTestId,
  headerEnd,
}: PlannerSectionProps) {
  const resolvedVariant = normalizeVariant(variant);
  const isSegment = layout === "segment";
  const isSubtle = resolvedVariant === "subtle";

  return (
    <section
      id={id}
      data-testid={dataTestId}
      className={cn(
        "scroll-mt-4",
        layout === "standalone" &&
          !isSubtle &&
          "planner-card-surface mb-8 overflow-hidden rounded-xl border border-border",
        isSegment && segmentDivider && "border-t border-border-strong",
        className,
      )}
    >
      <motion.div
        className={cn(
          isSegment && "px-4 py-4 sm:px-5",
          layout === "standalone" && !isSubtle && "px-4 py-4 sm:px-5 sm:py-5",
          isSubtle && "space-y-2",
        )}
      >
        <header
          className={cn(
            "flex flex-wrap items-start justify-between gap-x-3 gap-y-2",
            isSubtle ? "mb-2" : "mb-4",
          )}
        >
          <motion.div className={cn("flex min-w-0 items-start gap-3", step == null && "flex-1")}>
            {step != null ? (
              <span className={plannerStepBadgeClassName} aria-hidden>
                {step}
              </span>
            ) : null}
            <motion.div className={cn("min-w-0", step != null && "flex-1")}>
              <h2 className={titleStyles[resolvedVariant]}>{title}</h2>
              {description ? (
                <p className={descriptionStyles[resolvedVariant]}>{description}</p>
              ) : null}
            </motion.div>
          </motion.div>
          {headerEnd ? <motion.div className="shrink-0 font-sans">{headerEnd}</motion.div> : null}
        </header>
        <motion.div>{children}</motion.div>
      </motion.div>
    </section>
  );
}
