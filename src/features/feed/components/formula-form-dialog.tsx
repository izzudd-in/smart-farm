"use client";

import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
} from "lucide-react";

import {
  createFeedFormula,
  updateFeedFormula,
} from "@/features/feed/actions/feed";
import type {
  FeedFormulaView,
  FeedIngredientView,
} from "@/features/feed/types/feed";
import {
  calculateFormulaCost,
  calculateFormulaTotalPercentage,
} from "@/features/feed/utils/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FeedModal } from "./feed-modal";

type FormulaFormDialogProps = {
  formula?: FeedFormulaView;
  ingredients: FeedIngredientView[];
  onClose: () => void;
};

type CompositionRow = {
  ingredientId: string;
  percentage: string;
};

const currencyFormatter =
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  });

export function FormulaFormDialog({
  formula,
  ingredients,
  onClose,
}: FormulaFormDialogProps) {
  const router = useRouter();

  const [name, setName] = useState(
    formula?.name ?? "",
  );

  const [items, setItems] =
    useState<CompositionRow[]>(
      formula?.items.map((item) => ({
        ingredientId:
          item.ingredientId,
        percentage:
          item.percentage,
      })) ?? [],
    );

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  const calculations = useMemo(() => {
    const calculationItems =
      items.flatMap((item) => {
        const ingredient =
          ingredients.find(
            (candidate) =>
              candidate.id ===
              item.ingredientId,
          );

        const percentage =
          Number(
            item.percentage.replace(
              ",",
              ".",
            ),
          );

        if (
          !ingredient ||
          !Number.isFinite(
            percentage,
          )
        ) {
          return [];
        }

        return [
          {
            percentage,

            currentPricePerKg:
              Number(
                ingredient.currentPricePerKg,
              ),
          },
        ];
      });

    return {
      total:
        calculateFormulaTotalPercentage(
          calculationItems,
        ),

      cost:
        calculateFormulaCost(
          calculationItems,
        ),
    };
  }, [items, ingredients]);

  function addRow() {
    setItems((current) => [
      ...current,
      {
        ingredientId: "",
        percentage: "",
      },
    ]);
  }

  function updateRow(
    index: number,
    changes: Partial<CompositionRow>,
  ) {
    setItems((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...changes,
              }
            : item,
      ),
    );
  }

  function removeRow(
    index: number,
  ) {
    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    startTransition(async () => {
      const input = {
        name,
        items,
      };

      const result = formula
        ? await updateFeedFormula(
            formula.id,
            input,
          )
        : await createFeedFormula(
            input,
          );

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
      onClose();
    });
  }

  return (
    <FeedModal
      title={
        formula
          ? "Edit Formula Pakan"
          : "Tambah Formula Pakan"
      }
      description={
        formula?.isActive
          ? "Formula aktif harus tetap memiliki total komposisi 100%."
          : "Formula dapat disimpan sebagai draft sebelum komposisi mencapai 100%."
      }
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-5"
      >
        {error ? (
          <div
            role="alert"
            className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-sm text-danger"
          >
            {error}
          </div>
        ) : null}

        <Input
          label="Nama Formula"
          placeholder="Formula Layer Utama"
          value={name}
          disabled={isPending}
          onChange={(event) =>
            setName(event.target.value)
          }
        />

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-foreground">
              Komposisi
            </p>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={
                isPending ||
                ingredients.length === 0
              }
              onClick={addRow}
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Bahan
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-border p-5 text-center text-sm text-muted">
                Belum ada komposisi.
              </div>
            ) : (
              items.map(
                (item, index) => {
                  const selectedIds =
                    items
                      .map(
                        (
                          candidate,
                          candidateIndex,
                        ) =>
                          candidateIndex ===
                          index
                            ? null
                            : candidate.ingredientId,
                      )
                      .filter(Boolean);

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_100px_36px] gap-2"
                    >
                      <select
                        value={
                          item.ingredientId
                        }
                        disabled={
                          isPending
                        }
                        onChange={(
                          event,
                        ) =>
                          updateRow(
                            index,
                            {
                              ingredientId:
                                event
                                  .target
                                  .value,
                            },
                          )
                        }
                        className="h-10 min-w-0 rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      >
                        <option value="">
                          Pilih bahan
                        </option>

                        {ingredients.map(
                          (
                            ingredient,
                          ) => (
                            <option
                              key={
                                ingredient.id
                              }
                              value={
                                ingredient.id
                              }
                              disabled={
                                selectedIds.includes(
                                  ingredient.id,
                                )
                              }
                            >
                              {
                                ingredient.name
                              }
                              {!ingredient.isActive
                                ? " (Nonaktif)"
                                : ""}
                            </option>
                          ),
                        )}
                      </select>

                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          max="100"
                          step="0.01"
                          value={
                            item.percentage
                          }
                          disabled={
                            isPending
                          }
                          placeholder="0"
                          onChange={(
                            event,
                          ) =>
                            updateRow(
                              index,
                              {
                                percentage:
                                  event
                                    .target
                                    .value,
                              },
                            )
                          }
                          className="h-10 w-full rounded-[10px] border border-border bg-white px-3 pr-7 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />

                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">
                          %
                        </span>
                      </div>

                      <button
                        type="button"
                        aria-label="Hapus bahan"
                        disabled={
                          isPending
                        }
                        onClick={() =>
                          removeRow(
                            index,
                          )
                        }
                        className="flex h-10 w-9 items-center justify-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                },
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[10px] bg-[#F9FAFB] p-4">
          <div>
            <p className="text-xs text-muted">
              Total Komposisi
            </p>

            <p
              className={[
                "mt-1 font-semibold",
                Math.abs(
                  calculations.total -
                    100,
                ) < 0.001
                  ? "text-primary-hover"
                  : "text-[#B45309]",
              ].join(" ")}
            >
              {calculations.total.toLocaleString(
                "id-ID",
                {
                  maximumFractionDigits:
                    2,
                },
              )}
              %
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">
              Estimasi Biaya/kg
            </p>

            <p className="mt-1 font-semibold text-foreground">
              {calculations.cost ===
              null
                ? "—"
                : currencyFormatter.format(
                    calculations.cost,
                  )}
            </p>
          </div>
        </div>

        {formula?.isActive &&
        Math.abs(
          calculations.total - 100,
        ) >= 0.001 ? (
          <p className="text-xs text-[#B45309]">
            Formula aktif harus tetap
            berjumlah 100%.
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={onClose}
          >
            Batal
          </Button>

          <Button
            type="submit"
            disabled={
              isPending ||
              (formula?.isActive ===
                true &&
                Math.abs(
                  calculations.total -
                    100,
                ) >= 0.001)
            }
          >
            {isPending
              ? "Menyimpan..."
              : "Simpan Formula"}
          </Button>
        </div>
      </form>
    </FeedModal>
  );
}