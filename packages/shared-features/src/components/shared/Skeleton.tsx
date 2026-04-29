import { cn } from '../../index';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-light-gray rounded-lg animate-pulse", className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white border border-black/5 rounded-xl p-6 shadow-sm", className)}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3 rounded-lg" />
          <Skeleton className="h-2 w-1/4 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-8 w-2/3 rounded-lg mb-4" />
      <Skeleton className="h-2 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-black/5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-3 flex-1 rounded-lg" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={`c-${c}`} className="h-3 flex-1 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
