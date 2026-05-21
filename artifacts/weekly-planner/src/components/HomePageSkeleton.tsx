import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <div
      className="space-y-4 px-4 py-3 sm:px-5"
      data-testid="home-page-skeleton"
      aria-busy="true"
      aria-label="Loading planner"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="planner-card-surface rounded-xl border border-border p-4"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-10 w-full" />
          {i === 1 ? <Skeleton className="mt-2 h-24 w-full" /> : null}
        </div>
      ))}
    </div>
  );
}
