import { Card } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div
      className="min-w-0 space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Memuat ringkasan laporan"
    >
      {/* Header Skeleton */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="h-8 w-36 rounded-lg bg-border/60" />
          <div className="h-4 w-72 max-w-full rounded bg-border/40" />
        </div>
        <div className="h-11 w-32 rounded-[10px] bg-border/40 shrink-0" />
      </div>

      {/* Filter Card Skeleton */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-20 rounded-lg bg-border/40" />
          <div className="h-8 w-28 rounded-lg bg-border/40" />
          <div className="h-8 w-24 rounded-lg bg-border/40" />
          <div className="h-8 w-28 rounded-lg bg-border/40" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="h-11 w-full sm:max-w-[190px] rounded-[10px] bg-border/50" />
          <div className="h-11 w-full sm:max-w-[190px] rounded-[10px] bg-border/50" />
          <div className="h-11 w-24 rounded-[10px] bg-border/50" />
        </div>
      </Card>

      {/* Main KPI Cards Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-border/50" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <div className="h-3.5 w-24 rounded bg-border/40" />
              <div className="h-7 w-32 rounded bg-border/60" />
            </Card>
          ))}
        </div>
      </div>

      {/* 4 Detail Sections Skeleton */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-4">
            <div className="space-y-1">
              <div className="h-5 w-28 rounded bg-border/50" />
              <div className="h-3 w-40 rounded bg-border/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="rounded-[10px] bg-[#F9FAFB] p-3 space-y-1.5">
                  <div className="h-3 w-16 rounded bg-border/40" />
                  <div className="h-4 w-24 rounded bg-border/50" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Stock Section Skeleton */}
      <Card className="p-4 space-y-4">
        <div className="h-5 w-24 rounded bg-border/50" />
        <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <div className="h-24 rounded-[10px] bg-border/30" />
          <div className="h-24 rounded-[10px] bg-border/30" />
        </div>
      </Card>
    </div>
  );
}
