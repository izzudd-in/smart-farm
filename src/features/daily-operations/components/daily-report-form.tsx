"use client";

import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  LockKeyhole,
  Pencil,
  Plus,
} from "lucide-react";

import {
  completeDailyReport,
  saveDailyReportDraft,
} from "@/features/daily-operations/actions/daily-report";

import type {
  OperatorTodayKandang,
} from "@/features/daily-operations/types/daily-report";

import {
  DAILY_EXPENSE_CATEGORY_LABELS,
  DAILY_EXPENSE_CATEGORY_VALUES,
  type DailyExpenseCategoryValue,
} from "@/features/expenses/types/daily-expense";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  ReportStatusBadge,
} from "./report-status-badge";

type DailyReportFormProps = {
  kandang: OperatorTodayKandang;
};

function valueOrEmpty(
  value:
    | number
    | null
    | undefined,
): string {
  return value ===
    null ||
    value ===
      undefined
    ? ""
    : String(
        value,
      );
}

export function DailyReportForm({
  kandang,
}: DailyReportFormProps) {
  const router =
    useRouter();

  const report =
    kandang.report;

  const [
    saleableEgg,
    setSaleableEgg,
  ] = useState(
    valueOrEmpty(
      report?.saleableEgg,
    ),
  );

  const [
    damagedEgg,
    setDamagedEgg,
  ] = useState(
    valueOrEmpty(
      report?.damagedEgg,
    ),
  );

  const [
    feedUsed,
    setFeedUsed,
  ] = useState(
    valueOrEmpty(
      report?.feedUsed,
    ),
  );

  const [
    mortality,
    setMortality,
  ] = useState(
    valueOrEmpty(
      report?.mortality,
    ),
  );

  const [
    incidentalExpense,
    setIncidentalExpense,
  ] = useState(
    report?.incidentalExpense ??
      "",
  );

  const [
    incidentalExpenseCategory,
    setIncidentalExpenseCategory,
  ] = useState<
    | DailyExpenseCategoryValue
    | ""
  >(
    report?.incidentalExpenseCategory ??
      "",
  );

  const [
    incidentNote,
    setIncidentNote,
  ] = useState(
    report?.incidentNote ??
      "",
  );

  const [
    optionalOpen,
    setOptionalOpen,
  ] = useState(
    Boolean(
      report?.incidentalExpense ||
        report?.incidentNote,
    ),
  );

  const [
    compositionOverride,
    setCompositionOverride,
  ] = useState(
    false,
  );

  const [
    composition,
    setComposition,
  ] = useState(
    kandang.feed.items.map(
      (
        item,
      ) => ({
        ingredientId:
          item.ingredientId,

        ingredientName:
          item.ingredientName,

        percentage:
          item.percentage,
      }),
    ),
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const readOnly =
    !kandang.isEditable;

  const disabled =
    isPending ||
    readOnly;

  const coreComplete =
    saleableEgg.trim() !==
      "" &&
    damagedEgg.trim() !==
      "" &&
    feedUsed.trim() !==
      "" &&
    mortality.trim() !==
      "";

  const incidentalNeedsCategory =
    incidentalExpense.trim() !==
      "" &&
    !incidentalExpenseCategory;

  const totalComposition =
    useMemo(
      () =>
        composition.reduce(
          (
            total,
            item,
          ) => {
            const percentage =
              Number(
                item.percentage.replace(
                  ",",
                  ".",
                ),
              );

            return (
              total +
              (
                Number.isFinite(
                  percentage,
                )
                  ? percentage
                  : 0
              )
            );
          },
          0,
        ),
      [
        composition,
      ],
    );

  const compositionInvalid =
    compositionOverride &&
    Math.abs(
      totalComposition -
        100,
    ) >=
      0.001;

  function updatePercentage(
    ingredientId: string,
    percentage: string,
  ) {
    setComposition(
      (
        current,
      ) =>
        current.map(
          (
            item,
          ) =>
            item.ingredientId ===
            ingredientId
              ? {
                  ...item,
                  percentage,
                }
              : item,
        ),
    );
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      readOnly
    ) {
      return;
    }

    setError("");
    setSuccess("");

    if (saleableEgg.trim() !== "") {
      const num = Number(saleableEgg.trim().replace(",", "."));
      if (!Number.isFinite(num) || num < 0) {
        setError("Telur Jual harus berupa angka 0 atau lebih.");
        return;
      }
    }

    if (damagedEgg.trim() !== "") {
      const num = Number(damagedEgg.trim().replace(",", "."));
      if (!Number.isFinite(num) || num < 0) {
        setError("Telur Rusak harus berupa angka 0 atau lebih.");
        return;
      }
    }

    if (feedUsed.trim() !== "") {
      const num = Number(feedUsed.trim().replace(",", "."));
      if (!Number.isFinite(num) || num < 0) {
        setError("Pakan Digunakan harus berupa angka 0 atau lebih.");
        return;
      }
    }

    if (mortality.trim() !== "") {
      const num = Number(mortality.trim());
      if (!Number.isInteger(num) || num < 0) {
        setError("Ayam Mati harus berupa angka bulat 0 atau lebih.");
        return;
      }
    }

    const input = {
      kandangId:
        kandang.id,

      saleableEgg,
      damagedEgg,
      feedUsed,
      mortality,

      incidentalExpense,
      incidentalExpenseCategory,
      incidentNote,

      feedCompositionOverride:
        compositionOverride,

      feedComposition:
        composition.map(
          (
            item,
          ) => ({
            ingredientId:
              item.ingredientId,

            percentage:
              item.percentage,
          }),
        ),
    };

    startTransition(
      async () => {
        const result =
          coreComplete
            ? await completeDailyReport(
                input,
              )
            : await saveDailyReportDraft(
                input,
              );

        if (
          !result.success
        ) {
          setError(
            result.error,
          );
          return;
        }

        setSuccess(
          result.message,
        );

        router.refresh();
      },
    );
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              {kandang.code} ·{" "}
              {kandang.name}
            </p>

            <p className="mt-1 truncate text-sm text-muted">
              {
                kandang.flock
                  .name
              }
            </p>
          </div>

          <ReportStatusBadge
            status={
              kandang.status
            }
          />
        </div>

        <div className="space-y-5 p-4">
          {readOnly &&
          kandang.readOnlyReason ? (
            <div className="flex items-start gap-2 rounded-[10px] border border-border bg-[#F9FAFB] p-3 text-sm text-muted">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {
                  kandang.readOnlyReason
                }
              </span>
            </div>
          ) : null}

          {success ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-[10px] border border-[#BBF7D0] bg-primary-soft p-3 text-sm text-primary-hover"
            >
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {success}
              </span>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-sm text-danger"
            >
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="saleable-egg"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              label="Telur Jual (kg)"
              placeholder="0"
              value={
                saleableEgg
              }
              disabled={
                disabled
              }
              onChange={(
                event,
              ) => {
                setSaleableEgg(
                  event.target.value,
                );
                if (error) setError("");
              }}
            />

            <Input
              id="damaged-egg"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              label="Telur Rusak (kg)"
              placeholder="0"
              value={
                damagedEgg
              }
              disabled={
                disabled
              }
              onChange={(
                event,
              ) => {
                setDamagedEgg(
                  event.target.value,
                );
                if (error) setError("");
              }}
            />

            <Input
              id="feed-used"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              label="Pakan Digunakan (kg)"
              placeholder="0"
              value={
                feedUsed
              }
              disabled={
                disabled
              }
              onChange={(
                event,
              ) => {
                setFeedUsed(
                  event.target.value,
                );
                if (error) setError("");
              }}
            />

            <Input
              id="mortality"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              label="Ayam Mati (ekor)"
              placeholder="0"
              value={
                mortality
              }
              disabled={
                disabled
              }
              onChange={(
                event,
              ) => {
                setMortality(
                  event.target.value,
                );
                if (error) setError("");
              }}
            />
          </div>

          <div className="rounded-[10px] border border-border bg-[#F9FAFB] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Formula Pakan
            </p>

            {kandang.feed.source ===
            "NONE" ? (
              <div className="mt-2">
                <p className="text-sm font-medium text-[#B45309]">
                  Belum ada formula aktif
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Jika Pakan Digunakan diisi, Owner harus mengaktifkan formula pakan terlebih dahulu.
                </p>
              </div>
            ) : (
              <>
                <p className="mt-2 font-semibold text-foreground">
                  {kandang.feed
                    .formulaName ??
                    "Formula Tersimpan"}
                </p>

                <p className="mt-1 text-xs text-muted">
                  {kandang.feed.source ===
                  "REPORT_SNAPSHOT"
                    ? "Komposisi laporan tersimpan"
                    : "Komposisi standar digunakan"}
                </p>

                {!compositionOverride ? (
                  <p className="mt-3 break-words text-sm text-muted">
                    {composition
                      .map(
                        (
                          item,
                        ) =>
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
                      .join(
                        " · ",
                      )}
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {composition.map(
                      (
                        item,
                      ) => (
                        <div
                          key={
                            item.ingredientId
                          }
                          className="grid grid-cols-[1fr_110px] items-center gap-3"
                        >
                          <span className="min-w-0 truncate text-sm text-foreground">
                            {
                              item.ingredientName
                            }
                          </span>

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
                              disabled
                            }
                            onChange={(
                              event,
                            ) =>
                              updatePercentage(
                                item.ingredientId,
                                event.target.value,
                              )
                            }
                            className="h-10 w-full rounded-[10px] border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
                          />
                        </div>
                      ),
                    )}

                    <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                      <span className="text-muted">
                        Total
                      </span>

                      <span
                        className={
                          compositionInvalid
                            ? "font-semibold text-danger"
                            : "font-semibold text-primary-hover"
                        }
                      >
                        {totalComposition.toLocaleString(
                          "id-ID",
                          {
                            maximumFractionDigits:
                              2,
                          },
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )}

                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCompositionOverride(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-hover"
                  >
                    <Pencil className="h-3.5 w-3.5" />

                    {compositionOverride
                      ? "Gunakan Komposisi Tersimpan"
                      : "Ubah Komposisi Aktual"}
                  </button>
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() =>
                setOptionalOpen(
                  (
                    current,
                  ) =>
                    !current,
                )
              }
              className="flex w-full items-center justify-between gap-3 rounded-[10px] px-1 py-2 text-left text-sm font-medium text-primary-hover"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambahkan Pengeluaran / Kejadian
              </span>

              {optionalOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {optionalOpen ? (
              <div className="mt-3 space-y-4 rounded-[10px] bg-[#F9FAFB] p-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`expense-category-${kandang.id}`}
                    className="text-[13px] font-medium text-foreground"
                  >
                    Kategori
                  </label>

                  <select
                    id={`expense-category-${kandang.id}`}
                    value={
                      incidentalExpenseCategory
                    }
                    disabled={
                      disabled ||
                      incidentalExpense.trim() ===
                        ""
                    }
                    onChange={(
                      event,
                    ) =>
                      setIncidentalExpenseCategory(
                        event.target
                          .value as
                          | DailyExpenseCategoryValue
                          | "",
                      )
                    }
                    className="h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
                  >
                    <option value="">
                      Pilih kategori
                    </option>

                    {DAILY_EXPENSE_CATEGORY_VALUES.map(
                      (
                        category,
                      ) => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {
                            DAILY_EXPENSE_CATEGORY_LABELS[
                              category
                            ]
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <Input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  label="Nominal"
                  placeholder="150000"
                  value={
                    incidentalExpense
                  }
                  disabled={
                    disabled
                  }
                  onChange={(
                    event,
                  ) => {
                    const value =
                      event.target.value;

                    setIncidentalExpense(
                      value,
                    );

                    if (
                      value.trim() ===
                      ""
                    ) {
                      setIncidentalExpenseCategory(
                        "",
                      );
                    }
                  }}
                />

                {incidentalNeedsCategory ? (
                  <p className="text-xs text-danger">
                    Pilih kategori untuk pengeluaran ini.
                  </p>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`incident-${kandang.id}`}
                    className="text-[13px] font-medium text-foreground"
                  >
                    Catatan / Keterangan
                  </label>

                  <textarea
                    id={`incident-${kandang.id}`}
                    rows={4}
                    maxLength={1000}
                    value={
                      incidentNote
                    }
                    disabled={
                      disabled
                    }
                    placeholder="Opsional"
                    onChange={(
                      event,
                    ) =>
                      setIncidentNote(
                        event.target.value,
                      )
                    }
                    className="w-full resize-y rounded-[10px] border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-light focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#F3F4F6]"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {!readOnly ? (
            <div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={
                  isPending ||
                  compositionInvalid ||
                  incidentalNeedsCategory
                }
              >
                {isPending
                  ? "Menyimpan..."
                  : coreComplete
                    ? "Simpan Laporan"
                    : "Simpan Draft"}
              </Button>

              {!coreComplete ? (
                <p className="mt-2 text-center text-xs text-muted">
                  Laporan akan berstatus Belum Lengkap sampai empat input utama diisi.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </form>
  );
}