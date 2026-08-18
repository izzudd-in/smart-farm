import {
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FeedIngredientView } from "@/features/feed/types/feed";

type FeedIngredientListProps = {
  ingredients: FeedIngredientView[];
  pendingId: string | null;
  onEdit: (
    ingredient: FeedIngredientView,
  ) => void;
  onToggle: (
    ingredient: FeedIngredientView,
  ) => void;
};

const currencyFormatter =
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  });

export function FeedIngredientList({
  ingredients,
  pendingId,
  onEdit,
  onToggle,
}: FeedIngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">
          Belum ada bahan pakan.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {ingredients.map(
        (ingredient) => (
          <Card
            key={ingredient.id}
            className="p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">
                    {ingredient.name}
                  </p>

                  <Badge
                    variant={
                      ingredient.isActive
                        ? "success"
                        : "neutral"
                    }
                  >
                    {ingredient.isActive
                      ? "Aktif"
                      : "Nonaktif"}
                  </Badge>
                </div>

                <p className="mt-1 text-sm text-muted">
                  {currencyFormatter.format(
                    Number(
                      ingredient.currentPricePerKg,
                    ),
                  )}
                  /{ingredient.unit}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onEdit(
                      ingredient,
                    )
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant={
                    ingredient.isActive
                      ? "destructive"
                      : "secondary"
                  }
                  disabled={
                    pendingId ===
                    ingredient.id
                  }
                  onClick={() =>
                    onToggle(
                      ingredient,
                    )
                  }
                >
                  {ingredient.isActive ? (
                    <PowerOff className="h-3.5 w-3.5" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}

                  {pendingId ===
                  ingredient.id
                    ? "Memproses..."
                    : ingredient.isActive
                      ? "Nonaktifkan"
                      : "Aktifkan"}
                </Button>
              </div>
            </div>
          </Card>
        ),
      )}
    </div>
  );
}