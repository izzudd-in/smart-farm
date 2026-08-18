import { Card } from "@/components/ui/card";
import type { OwnerDailySummary as OwnerDailySummaryType } from "@/features/daily-operations/types/daily-report";

type OwnerDailySummaryProps = {
  summary: OwnerDailySummaryType;
};

const items = [
  {
    key: "total",
    label: "Total Kandang",
  },
  {
    key: "complete",
    label: "Selesai",
  },
  {
    key: "incomplete",
    label: "Belum Lengkap",
  },
  {
    key: "notStarted",
    label: "Belum Diisi",
  },
] as const;

export function OwnerDailySummary({
  summary,
}: OwnerDailySummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.key}
          className="p-4"
        >
          <p className="text-xs text-muted">
            {item.label}
          </p>

          <p className="mt-1 text-2xl font-semibold text-foreground">
            {summary[item.key]}
          </p>
        </Card>
      ))}
    </div>
  );
}