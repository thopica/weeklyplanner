import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface LegalArticleProps {
  title: string;
  children: ReactNode;
}

export function LegalArticle({ title, children }: LegalArticleProps) {
  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <header className="border-b border-border bg-card px-6 py-4 shadow-tinted sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Back to planner
        </Link>
      </header>
      <main className="mx-auto max-w-prose px-6 py-10 sm:px-8 sm:py-14">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance text-foreground">
          {title}
        </h1>
        <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground prose-headings:font-serif prose-headings:text-foreground prose-p:leading-relaxed">
          {children}
        </div>
      </main>
    </div>
  );
}
