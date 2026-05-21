"use client";

import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { tasteSpringContent, tasteTransition } from "@/lib/motion";
import { guideStaggerParent } from "@/components/guide/guide-motion";

interface GuideLayoutProps {
  children: ReactNode;
}

export function GuideLayout({ children }: GuideLayoutProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative isolate min-h-dvh bg-background font-sans text-foreground">
      <header className="border-b border-border bg-card px-4 py-4 shadow-tinted sm:px-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-[color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          data-testid="link-back-to-settings"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Back to Settings
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tasteTransition(reduceMotion, tasteSpringContent)}
          className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_3rem] md:items-end"
        >
          <div className="min-w-0">
            <h1 className="type-page-title">Hi There</h1>
            <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
              Setup, backups, and how to keep your planner data safe.
            </p>
          </div>
          <div
            className="hidden h-px w-full bg-linear-to-r from-transparent via-border to-transparent md:block md:h-16 md:w-px md:bg-linear-to-b md:from-transparent md:via-primary/35 md:to-transparent"
            aria-hidden
          />
        </motion.div>

        <motion.div
          className="mt-8 space-y-8"
          variants={reduceMotion ? undefined : guideStaggerParent}
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "show"}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
