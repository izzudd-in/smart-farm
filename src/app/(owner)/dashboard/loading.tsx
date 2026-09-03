import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div
      className="min-w-0 space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Memuat dashboard manajemen"
    >
      {/* Title Skeleton */}
      <div className="space-y-1.5">
        <div className="h-8 w-48 rounded-lg bg-border/60" />
        <div className="h-4 w-72 rounded bg-border/40" />
      </div>

      {/* 1. KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-border/40" />
              <div className="h-8 w-8 rounded-lg bg-border/40" />
            </div>
            <div className="h-7 w-32 rounded bg-border/60" />
            <div className="h-3 w-40 rounded bg-border/30" />
          </Card>
        ))}
      </div>

      {/* 2. Alerts & Active Egg Price Skeleton */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="p-4 space-y-3">
          <div className="h-5 w-32 rounded bg-border/50" />
          <div className="h-3 w-56 rounded bg-border/30" />
          <div className="space-y-2 pt-1">
            <div className="h-16 rounded-[10px] bg-border/30" />
            <div className="h-16 rounded-[10px] bg-border/30" />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="h-5 w-28 rounded bg-border/50" />
          <div className="h-7 w-36 rounded bg-border/60" />
          <div className="h-3 w-44 rounded bg-border/30" />
        </Card>
      </div>

      {/* 3. Trend Produksi 7 Hari Skeleton */}
      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-5 w-48 rounded bg-border/50" />
            <div className="h-3 w-60 rounded bg-border/30" />
          </div>
          <div className="h-6 w-28 rounded-full bg-border/40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="h-14 rounded-[10px] bg-border/30" />
          <div className="h-14 rounded-[10px] bg-border/30" />
          <div className="h-14 rounded-[10px] bg-border/30" />
        </div>
        <div className="space-y-2.5 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-12 rounded bg-border/40" />
              <div className="h-7 flex-1 rounded-[8px] bg-border/30" />
              <div className="h-4 w-14 rounded bg-border/40" />
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Kandang Status Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 rounded bg-border/50" />
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-5 w-28 rounded bg-border/50" />
                <div className="h-5 w-16 rounded-full bg-border/40" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 rounded-[10px] bg-border/30" />
                <div className="h-12 rounded-[10px] bg-border/30" />
                <div className="h-12 rounded-[10px] bg-border/30" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. Activities Skeleton */}
      <Card className="p-4 space-y-4">
        <div className="space-y-1">
          <div className="h-5 w-36 rounded bg-border/50" />
          <div className="h-3 w-48 rounded bg-border/30" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-[9px] bg-border/40 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-44 rounded bg-border/50" />
                <div className="h-3 w-60 rounded bg-border/30" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
