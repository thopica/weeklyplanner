import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <header className="border-b border-border bg-card px-4 py-4 shadow-tinted sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          data-testid="link-back-to-planner"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Back to planner
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Configure your planner once—theme, schedule, habits, and backups.{" "}
          <Link
            href="/guide"
            className="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid="link-guide"
          >
            Setup and keeping your data safe
          </Link>
        </p>
        <div className="mt-8 space-y-8">{children}</div>
      </main>
    </div>
  );
}
