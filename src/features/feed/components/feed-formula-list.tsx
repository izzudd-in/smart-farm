import {
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FeedFormulaView } from "@/features/feed/types/feed";

type FeedFormulaListProps = {
  formulas: FeedFormulaView[];
  pendingId: string | null;
  onEdit: (
    formula: FeedFormulaView,
  ) => void;
  onToggle: (
    formula: FeedFormulaView,
  ) => void;
};

const currencyFormatter =
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  });

export function FeedFormulaList({
  formulas,
  pendingId,
  onEdit,
  onToggle,
}: FeedFormulaListProps) {
  if (formulas.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">
          Belum ada formula pakan.
        </p>

        <p className="mt-1 text-sm text-muted">
          Tambahkan formula untuk mulai
          menyusun komposisi pakan.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {formulas.map((formula) => {
        const composition =
          formula.items.length === 0
            ? "Belum ada komposisi"
            : formula.items
                .map(
                  (item) =>
                    `${item.ingredientName} ${Number(
                      item.percentage,
                    ).toLocaleString(
                      "id-ID",
                      {
                        maximumFractionDigits:
                          2,
                      },
                    )}%`,
                )
                .join(" · ");

        return (
          <Card
            key={formula.id}
            className="min-w-0 p-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-foreground">
                    {formula.name}
                  </h2>

                  <Badge
                    variant={
                      formula.isActive
                        ? "success"
                        : "neutral"
                    }
                  >
                    {formula.isActive
                      ? "Aktif"
                      : "Nonaktif"}
                  </Badge>

                  {Math.abs(
                    formula.totalPercentage -
                      100,
                  ) >= 0.001 ? (
                    <Badge variant="warning">
                      {
                        formula.totalPercentage
                      }
                      %
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-2 break-words text-sm text-muted">
                  {composition}
                </p>

                <p className="mt-3 text-sm font-medium text-foreground">
                  Estimasi{" "}
                  {formula.estimatedCostPerKg ===
                  null
                    ? "—"
                    : currencyFormatter.format(
                        formula.estimatedCostPerKg,
                      )}
                  {formula.estimatedCostPerKg !==
                  null
                    ? "/kg"
                    : ""}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onEdit(formula)
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant={
                    formula.isActive
                      ? "destructive"
                      : "secondary"
                  }
                  disabled={
                    pendingId ===
                    formula.id
                  }
                  onClick={() =>
                    onToggle(formula)
                  }
                >
                  {formula.isActive ? (
                    <PowerOff className="h-3.5 w-3.5" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}

                  {pendingId ===
                  formula.id
                    ? "Memproses..."
                    : formula.isActive
                      ? "Nonaktifkan"
                      : "Aktifkan"}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}