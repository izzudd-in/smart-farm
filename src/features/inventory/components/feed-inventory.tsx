"use client";

import {
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  PackagePlus,
  Plus,
  Scale,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type {
  FeedInventoryData,
  FeedStockMovement,
} from "@/features/inventory/types/inventory";

import {
  formatInventoryDate,
  formatInventoryKg,
} from "@/features/inventory/utils/inventory";

import { FeedStockFormDialog } from "./feed-stock-form-dialog";

type FeedInventoryProps = {
  data: FeedInventoryData;
};

const currencyFormatter =
  new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    },
  );

function MovementQuantity({
  movement,
}: {
  movement: FeedStockMovement;
}) {
  const incoming =
    movement.direction ===
    "IN";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1 font-semibold",
        incoming
          ? "text-primary-hover"
          : "text-danger",
      ].join(" ")}
    >
      {incoming ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )}

      {incoming
        ? "+"
        : "-"}

      {formatInventoryKg(
        movement.quantityKg,
      )}
    </span>
  );
}

export function FeedInventory({
  data,
}: FeedInventoryProps) {
  const [
    dialog,
    setDialog,
  ] = useState<
    | {
        mode:
          | "purchase"
          | "opening"
          | "adjustment";

        ingredientId?: string;
      }
    | null
  >(null);

  const negativeIngredients =
    data.ingredients.filter(
      (ingredient) =>
        ingredient.isNegative,
    );

  return (
    <>
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm text-muted">
            Pemakaian pakan berasal dari Daily Report lengkap dan komposisi snapshot laporan, bukan formula master saat ini.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() =>
                setDialog({
                  mode:
                    "adjustment",
                })
              }
            >
              <Scale className="h-4 w-4" />
              Koreksi Stok
            </Button>

            <Button
              onClick={() =>
                setDialog({
                  mode:
                    "purchase",
                })
              }
            >
              <PackagePlus className="h-4 w-4" />
              Pembelian Pakan
            </Button>
          </div>
        </div>

        {negativeIngredients.map(
          (ingredient) => (
            <div
              key={
                ingredient.ingredientId
              }
              role="alert"
              className="flex items-start gap-2.5 rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-sm text-danger"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                Stok{" "}
                {
                  ingredient.ingredientName
                }{" "}
                negatif. Periksa pembelian, pemakaian, stok awal, atau koreksi.
              </span>
            </div>
          ),
        )}

        {data.ingredients.length ===
        0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium text-foreground">
              Belum ada bahan pakan.
            </p>

            <p className="mt-1 text-sm text-muted">
              Tambahkan bahan melalui menu Pakan terlebih dahulu.
            </p>
          </Card>
        ) : (
          <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.ingredients.map(
              (ingredient) => (
                <Card
                  key={
                    ingredient.ingredientId
                  }
                  className="min-w-0 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-foreground">
                          {
                            ingredient.ingredientName
                          }
                        </p>

                        {!ingredient.isActive ? (
                          <Badge variant="neutral">
                            Nonaktif
                          </Badge>
                        ) : null}
                      </div>

                      <p
                        className={[
                          "mt-2 text-2xl font-semibold",
                          ingredient.isNegative
                            ? "text-danger"
                            : "text-foreground",
                        ].join(" ")}
                      >
                        {formatInventoryKg(
                          ingredient.currentStockKg,
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-muted">
                        Stok per tanggal terpilih
                      </p>
                    </div>

                    {!ingredient.hasOpening ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDialog({
                            mode:
                              "opening",

                            ingredientId:
                              ingredient.ingredientId,
                          })
                        }
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-primary-hover hover:bg-primary-soft"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Stok Awal
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                    <div>
                      <p className="text-xs text-muted">
                        Pembelian
                      </p>

                      <p className="mt-1 font-medium text-foreground">
                        {formatInventoryKg(
                          ingredient.purchaseKg,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted">
                        Pemakaian
                      </p>

                      <p className="mt-1 font-medium text-foreground">
                        {formatInventoryKg(
                          ingredient.usageKg,
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              ),
            )}
          </div>
        )}

        <div>
          <div className="mb-3">
            <h2 className="font-semibold text-foreground">
              Riwayat Movement
            </h2>

            <p className="mt-1 text-xs text-muted">
              Movement sampai{" "}
              {formatInventoryDate(
                data.asOfDate,
              )}
            </p>
          </div>

          {data.movements.length ===
          0 ? (
            <Card className="p-8 text-center">
              <p className="font-medium text-foreground">
                Belum ada movement stok pakan sampai tanggal ini.
              </p>

              <p className="mt-1 text-sm text-muted">
                Bahan tanpa movement tetap memiliki stok 0 kg.
              </p>
            </Card>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {data.movements.map(
                  (movement) => (
                    <Card
                      key={
                        movement.id
                      }
                      className="min-w-0 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {
                              movement.ingredientName
                            }
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            {
                              movement.title
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {formatInventoryDate(
                              movement.occurredAt,
                            )}
                          </p>

                          {movement.subtitle ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted">
                              {
                                movement.subtitle
                              }
                            </p>
                          ) : null}

                          {movement.unitPricePerKg &&
                          movement.totalPrice ? (
                            <p className="mt-2 text-xs text-muted">
                              {currencyFormatter.format(
                                Number(
                                  movement.unitPricePerKg,
                                ),
                              )}
                              /kg ·{" "}
                              {currencyFormatter.format(
                                Number(
                                  movement.totalPrice,
                                ),
                              )}
                            </p>
                          ) : null}
                        </div>

                        <MovementQuantity
                          movement={
                            movement
                          }
                        />
                      </div>
                    </Card>
                  ),
                )}
              </div>

              <Card className="hidden overflow-hidden md:block">
                <div className="grid grid-cols-[130px_150px_minmax(0,1fr)_170px] gap-4 border-b border-border bg-[#F9FAFB] px-4 py-2.5 text-xs font-medium text-muted">
                  <span>
                    Tanggal
                  </span>

                  <span>
                    Bahan
                  </span>

                  <span>
                    Movement
                  </span>

                  <span className="text-right">
                    Jumlah
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {data.movements.map(
                    (movement) => (
                      <div
                        key={
                          movement.id
                        }
                        className="grid min-w-0 grid-cols-[130px_150px_minmax(0,1fr)_170px] items-center gap-4 px-4 py-3"
                      >
                        <p className="text-sm text-muted">
                          {formatInventoryDate(
                            movement.occurredAt,
                          )}
                        </p>

                        <p className="truncate text-sm font-medium text-foreground">
                          {
                            movement.ingredientName
                          }
                        </p>

                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">
                            {
                              movement.title
                            }
                          </p>

                          {movement.subtitle ? (
                            <p className="mt-0.5 truncate text-xs text-muted">
                              {
                                movement.subtitle
                              }
                            </p>
                          ) : null}

                          {movement.unitPricePerKg &&
                          movement.totalPrice ? (
                            <p className="mt-0.5 text-xs text-muted">
                              {currencyFormatter.format(
                                Number(
                                  movement.unitPricePerKg,
                                ),
                              )}
                              /kg ·{" "}
                              {currencyFormatter.format(
                                Number(
                                  movement.totalPrice,
                                ),
                              )}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex justify-end">
                          <MovementQuantity
                            movement={
                              movement
                            }
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {dialog ? (
        <FeedStockFormDialog
          mode={
            dialog.mode
          }
          ingredients={
            data.ingredientOptions
          }
          selectedIngredientId={
            dialog.ingredientId
          }
          onClose={() =>
            setDialog(null)
          }
        />
      ) : null}
    </>
  );
}