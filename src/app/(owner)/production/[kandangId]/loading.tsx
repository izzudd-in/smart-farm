import { Card } from "@/components/ui/card";

export default function ProductionKandangDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat detail produksi kandang">
      {/* Back button & Title skeleton */}
      <div>
        <div className="h-4 w-36 rounded bg-border/50" />
        <div className="mt-3 h-8 w-56 rounded-lg bg-border/60" />
        <div className="mt-1 h-4 w-40 rounded bg-border/40" />
      </div>

      {/* Filter skeleton */}
      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-24 rounded bg-border/40" />
          <div className="h-6 w-24 rounded bg-border/40" />
          <div className="h-6 w-24 rounded bg-border/40" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-10 rounded-[10px] bg-border/50" />
          <div className="h-10 rounded-[10px] bg-border/50" />
          <div className="h-10 rounded-[10px] bg-border/50" />
          <div className="h-10 rounded-[10px] bg-border/50" />
        </div>
      </Card>

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

      {/* Trend skeleton */}
      <Card className="p-5 space-y-4">
        <div className="h-5 w-32 rounded bg-border/50" />
        <div className="h-44 w-full rounded-lg bg-border/30" />
      </Card>

      {/* History table skeleton */}
      <Card className="p-4 space-y-3">
        <div className="h-5 w-40 rounded bg-border/50" />
        <div className="h-64 w-full rounded bg-border/30" />
      </Card>
    </div>
  );
}
