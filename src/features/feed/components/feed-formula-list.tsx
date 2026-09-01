"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
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
  onEdit: (formula: FeedFormulaView) => void;
  onToggle: (formula: FeedFormulaView) => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function FeedFormulaList({
  formulas,
  pendingId,
  onEdit,
  onToggle,
}: FeedFormulaListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const activeFormula = formulas.find((f) => f.isActive);
    return new Set(activeFormula ? [activeFormula.id] : formulas.length > 0 ? [formulas[0].id] : []);
  });

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (formulas.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">Belum ada formula pakan.</p>
        <p className="mt-1 text-sm text-muted">
          Tambahkan formula untuk mulai menyusun komposisi pakan.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {formulas.map((formula) => {
        const isExpanded = expandedIds.has(formula.id);
        const hasInactiveIngredient = formula.items.some(
          (item) => !item.ingredientIsActive,
        );

        return (
          <Card
            key={formula.id}
            className={[
              "min-w-0 transition-all duration-150",
              formula.isActive
                ? "border-primary/40 shadow-xs ring-1 ring-primary/20"
                : "border-border",
            ].join(" ")}
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {formula.name}
                    </h2>

                    <Badge
                      variant={formula.isActive ? "success" : "neutral"}
                    >
                      {formula.isActive ? "Formula Aktif" : "Draft / Nonaktif"}
                    </Badge>

                    {Math.abs(formula.totalPercentage - 100) >= 0.001 ? (
                      <Badge variant="warning">
                        Total {formula.totalPercentage}%
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="bg-success-soft text-success text-xs">
                        100%
                      </Badge>
                    )}

                    {hasInactiveIngredient ? (
                      <Badge variant="danger">
                        Bahan Nonaktif
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <p>
                      <span className="text-foreground font-medium">
                        {formula.items.length}
                      </span>{" "}
                      bahan pakan
                    </p>
                    <span>•</span>
                    <p>
                      Estimasi Biaya:{" "}
                      <span className="font-semibold text-foreground">
                        {formula.estimatedCostPerKg === null
                          ? "—"
                          : `${currencyFormatter.format(formula.estimatedCostPerKg)}/kg`}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(formula)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant={formula.isActive ? "destructive" : "secondary"}
                    disabled={pendingId === formula.id}
                    onClick={() => onToggle(formula)}
                  >
                    {formula.isActive ? (
                      <PowerOff className="h-3.5 w-3.5" />
                    ) : (
                      <Power className="h-3.5 w-3.5" />
                    )}
                    {pendingId === formula.id
                      ? "Memproses..."
                      : formula.isActive
                        ? "Nonaktifkan"
                        : "Aktifkan"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpand(formula.id)}
                    aria-label={isExpanded ? "Sembunyikan detail" : "Lihat detail"}
                    className="text-muted hover:text-foreground"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Tutup</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        <span className="hidden sm:inline">Detail</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Collapsible Accordion Content */}
              {isExpanded ? (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Rincian Komposisi & Biaya Bahan
                    </p>
                  </div>

                  {formula.items.length === 0 ? (
                    <p className="text-sm text-muted italic">
                      Belum ada komposisi bahan. Klik Edit untuk menambahkan bahan.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-[8px] border border-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#F9FAFB] text-xs font-medium text-muted">
                          <tr>
                            <th className="px-3 py-2.5">Bahan Pakan</th>
                            <th className="px-3 py-2.5 text-right">Persentase</th>
                            <th className="px-3 py-2.5 text-right">Harga/kg</th>
                            <th className="px-3 py-2.5 text-right">Kontribusi Biaya/kg</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-white">
                          {formula.items.map((item) => {
                            const pct = Number(item.percentage);
                            const price = Number(item.currentPricePerKg);
                            const costContribution = (pct / 100) * price;

                            return (
                              <tr key={item.ingredientId} className="hover:bg-[#F9FAFB]/60">
                                <td className="px-3 py-2.5 font-medium text-foreground">
                                  <div className="flex items-center gap-2">
                                    <span>{item.ingredientName}</span>
                                    {!item.ingredientIsActive ? (
                                      <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                                        Nonaktif
                                      </Badge>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-right text-foreground font-semibold">
                                  {pct.toLocaleString("id-ID", {
                                    maximumFractionDigits: 2,
                                  })}
                                  %
                                </td>
                                <td className="px-3 py-2.5 text-right text-muted">
                                  {currencyFormatter.format(price)}
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium text-foreground">
                                  {currencyFormatter.format(costContribution)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="border-t-2 border-border bg-[#F9FAFB] font-semibold text-foreground">
                          <tr>
                            <td className="px-3 py-2.5 text-xs uppercase tracking-wider text-muted">
                              Total
                            </td>
                            <td
                              className={[
                                "px-3 py-2.5 text-right font-bold",
                                Math.abs(formula.totalPercentage - 100) < 0.001
                                  ? "text-primary-hover"
                                  : "text-[#B45309]",
                              ].join(" ")}
                            >
                              {formula.totalPercentage.toLocaleString("id-ID", {
                                maximumFractionDigits: 2,
                              })}
                              %
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs text-muted">
                              —
                            </td>
                            <td className="px-3 py-2.5 text-right text-primary-hover font-bold">
                              {formula.estimatedCostPerKg === null
                                ? "—"
                                : currencyFormatter.format(formula.estimatedCostPerKg)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}