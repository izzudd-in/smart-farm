import { Card } from "@/components/ui/card";

export default function ProductionLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data produksi">
      {/* Title skeleton */}
      <div>
        <div className="h-8 w-44 rounded-lg bg-border/60" />
        <div className="mt-2 h-4 w-60 rounded bg-border/40" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-16 rounded bg-border/50" />
              <div className="h-7 w-7 rounded-lg bg-border/50" />
            </div>
            <div className="h-6 w-24 rounded bg-border/60" />
            <div className="h-3 w-16 rounded bg-border/40" />
          </Card>
        ))}
      </div>

      {/* Filter Panel skeleton */}
      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-28 rounded-lg bg-border/50" />
          <div className="h-6 w-28 rounded-lg bg-border/50" />
          <div className="h-6 w-28 rounded-lg bg-border/50" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-10 rounded-[10px] bg-border/50" />
          <div className="h-10 rounded-[10px] bg-border/50" />
          <div className="h-10 rounded-[10px] bg-border/50" />
          <div className="h-10 rounded-[10px] bg-border/50" />
        </div>
      </Card>

      {/* Trend Chart skeleton */}
      <Card className="p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-32 rounded bg-border/50" />
          <div className="flex gap-1.5">
            <div className="h-7 w-20 rounded-lg bg-border/40" />
            <div className="h-7 w-20 rounded-lg bg-border/40" />
          </div>
        </div>
        <div className="h-44 w-full rounded-lg bg-border/30" />
      </Card>

      {/* Kandang Cards skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-border/50" />
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[10px] bg-border/50" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-36 rounded bg-border/60" />
                  <div className="h-3 w-24 rounded bg-border/40" />
                </div>
                <div className="h-8 w-16 rounded-lg bg-border/40" />
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
                <div className="h-8 rounded bg-border/30" />
                <div className="h-8 rounded bg-border/30" />
                <div className="h-8 rounded bg-border/30" />
                <div className="h-8 rounded bg-border/30" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
