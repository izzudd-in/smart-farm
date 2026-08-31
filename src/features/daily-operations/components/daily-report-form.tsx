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
  ClipboardCheck,
  Egg,
  FileText,
  LockKeyhole,
  Pencil,
  Plus,
  Wheat,
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

  const filledCoreCount =
    useMemo(() => {
      let count = 0;
      if (saleableEgg.trim() !== "") count++;
      if (damagedEgg.trim() !== "") count++;
      if (feedUsed.trim() !== "") count++;
      if (mortality.trim() !== "") count++;
      return count;
    }, [saleableEgg, damagedEgg, feedUsed, mortality]);

  const progressPercentage =
    (filledCoreCount / 4) * 100;

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

        <div className="space-y-6 p-4">
          {/* Progress Indicator */}
          <div className="rounded-[10px] border border-border bg-[#F9FAFB] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4 text-primary-hover" />
                Progres Pengisian Laporan
              </span>
              <span
                className={
                  filledCoreCount === 4
                    ? "font-semibold text-primary-hover"
                    : "font-medium text-muted"
                }
              >
                {filledCoreCount} dari 4 data wajib ({Math.round(progressPercentage)}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className={`h-full transition-all duration-300 ${
                  filledCoreCount === 4
                    ? "bg-[#10B981]"
                    : filledCoreCount > 0
                      ? "bg-[#F59E0B]"
                      : "bg-transparent"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

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

          {/* Section 1: Data Produksi & Populasi */}
          <div className="space-y-4 rounded-[10px] border border-border/80 p-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-hover font-semibold text-xs">
                  <Egg className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    1. Data Produksi & Kematian
                  </h3>
                  <p className="text-xs text-muted">
                    Catat telur panen dan mortalitas ayam hari ini
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted">
                {[saleableEgg, damagedEgg, mortality].filter((v) => v.trim() !== "").length}/3 terisi
              </span>
            </div>

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

              <div className="sm:col-span-2">
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
            </div>
          </div>

          {/* Section 2: Data Pakan */}
          <div className="space-y-4 rounded-[10px] border border-border/80 p-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-hover font-semibold text-xs">
                  <Wheat className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    2. Data Konsumsi Pakan
                  </h3>
                  <p className="text-xs text-muted">
                    Catat bobot pakan dan verifikasi formula pakan aktif
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted">
                {feedUsed.trim() !== "" ? "1/1 terisi" : "0/1 terisi"}
              </span>
            </div>

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
          </div>

          {/* Section 3: Pengeluaran & Catatan Kejadian */}
          <div className="rounded-[10px] border border-border/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#4B5563] font-semibold text-xs">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    3. Pengeluaran & Catatan Kejadian
                  </h3>
                  <p className="text-xs text-muted">
                    Opsional — biaya insidental atau kejadian khusus
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-muted">
                Opsional
              </span>
            </div>

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
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-[10px] border border-dashed border-border bg-[#F9FAFB]/50 px-3 py-2.5 text-left text-sm font-medium text-primary-hover hover:bg-[#F9FAFB]"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {optionalOpen
                  ? "Sembunyikan Form Pengeluaran & Catatan"
                  : "Buka Form Pengeluaran & Catatan"}
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