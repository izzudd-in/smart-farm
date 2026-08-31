"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  FeedCostBasis,
  UserRole,
} from "@/generated/prisma/enums";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireRole,
} from "@/server/auth/guards";

import {
  DailyReportValidationError,
  parseDailyReportInput,
} from "@/features/daily-operations/schemas/daily-report";

import type {
  DailyReportActionResult,
  DailyReportFormInput,
} from "@/features/daily-operations/types/daily-report";

import {
  getJakartaTodayDate,
} from "@/features/daily-operations/utils/date";

import {
  getDailyReportStatus,
} from "@/features/daily-operations/utils/status";

import {
  assertFormulaComplete,
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";

import {
  resolveFeedUnitCostForDate,
} from "@/features/feed/queries/resolve-feed-unit-cost";

const TODAY_PATH =
  "/operator/today";

const HISTORY_PATH =
  "/operator/history";

const OWNER_DAILY_PATH =
  "/daily";

const FEED_PATH =
  "/feed";

const EXPENSES_PATH =
  "/expenses";

function ruleError(
  message: string,
): Error {
  return new Error(
    `DAILY_REPORT_RULE:${message}`,
  );
}

function handleActionError(
  error: unknown,
): DailyReportActionResult {
  if (
    error instanceof
    DailyReportValidationError
  ) {
    return {
      success: false,
      error:
        error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "DAILY_REPORT_RULE:",
    )
  ) {
    return {
      success: false,

      error:
        error.message.replace(
          "DAILY_REPORT_RULE:",
          "",
        ),
    };
  }

  if (
    error instanceof Error &&
    [
      "UNAUTHENTICATED",
      "FORBIDDEN",
    ].includes(
      error.message,
    )
  ) {
    return {
      success: false,
      error:
        "Akses ditolak.",
    };
  }

  console.error(
    error,
  );

  return {
    success: false,

    error:
      "Terjadi kesalahan saat menyimpan laporan.",
  };
}

async function saveReport(
  input: DailyReportFormInput,
  requireComplete: boolean,
): Promise<DailyReportActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OPERATOR,
      );

    const parsed =
      parseDailyReportInput(
        input,
        requireComplete,
      );

    const reportDate =
      getJakartaTodayDate();

    const saved =
      await prisma.$transaction(
        async (
          tx,
        ) => {
          const kandang =
            await tx.kandang.findFirst({
              where: {
                id:
                  parsed.kandangId,

                isActive:
                  true,

                operators: {
                  some: {
                    id:
                      user.id,
                  },
                },
              },

              select: {
                id:
                  true,

                farmId:
                  true,

                activeFlock: {
                  select: {
                    id:
                      true,

                    startDate:
                      true,

                    initialPopulation:
                      true,
                  },
                },
              },
            });

          if (!kandang) {
            throw ruleError(
              "Kandang tidak ditemukan, tidak aktif, atau tidak di-assign kepada Anda.",
            );
          }

          if (
            !kandang.activeFlock
          ) {
            throw ruleError(
              "Kandang belum memiliki flock aktif.",
            );
          }

          if (
            reportDate <
            kandang.activeFlock
              .startDate
          ) {
            throw ruleError(
              "Laporan tidak boleh dibuat sebelum flock dimulai.",
            );
          }

          const existing =
            await tx.dailyReport.findUnique({
              where: {
                date_kandangId: {
                  date:
                    reportDate,

                  kandangId:
                    kandang.id,
                },
              },

              select: {
                id:
                  true,

                flockId:
                  true,

                operatorId:
                  true,

                feedFormulaId:
                  true,

                feedFormulaNameSnapshot:
                  true,

                operator: {
                  select: {
                    name:
                      true,
                  },
                },

                feedItems: {
                  orderBy: {
                    ingredientNameSnapshot:
                      "asc",
                  },

                  select: {
                    ingredientId:
                      true,

                    ingredientNameSnapshot:
                      true,

                    percentage:
                      true,

                    unitCostPerKgSnapshot:
                      true,

                    costBasisSnapshot:
                      true,
                  },
                },
              },
            });

          if (
            existing &&
            existing.operatorId !==
              user.id
          ) {
            throw ruleError(
              `Laporan hari ini sudah diisi oleh ${existing.operator.name}.`,
            );
          }

          if (
            existing &&
            existing.flockId !==
              kandang.activeFlock.id
          ) {
            throw ruleError(
              "Laporan hari ini sudah terikat ke flock lain.",
            );
          }

          type SnapshotItem = {
            ingredientId:
              string;

            ingredientNameSnapshot:
              string;

            percentage:
              string;

            unitCostPerKgSnapshot:
              string | null;

            costBasisSnapshot:
              FeedCostBasis | null;
          };

          type Snapshot = {
            formulaId:
              string | null;

            formulaNameSnapshot:
              string;

            items:
              SnapshotItem[];
          };

          let snapshot:
            Snapshot | null =
              null;

          /*
           * Existing report:
           * preserve seluruh snapshot lama,
           * termasuk cost. Tidak resolve ulang.
           */
          if (
            existing &&
            existing.feedItems
              .length > 0
          ) {
            snapshot = {
              formulaId:
                existing.feedFormulaId,

              formulaNameSnapshot:
                existing.feedFormulaNameSnapshot ??
                "Formula Tersimpan",

              items:
                existing.feedItems.map(
                  (
                    item,
                  ): SnapshotItem => ({
                    ingredientId:
                      item.ingredientId,

                    ingredientNameSnapshot:
                      item.ingredientNameSnapshot,

                    percentage:
                      item.percentage.toString(),

                    unitCostPerKgSnapshot:
                      item.unitCostPerKgSnapshot
                        ?.toString() ??
                      null,

                    costBasisSnapshot:
                      item.costBasisSnapshot,
                  }),
                ),
            };
          } else {
            const activeFormula =
              await tx.feedFormula.findFirst({
                where: {
                  farmId:
                    kandang.farmId,

                  isActive:
                    true,
                },

                select: {
                  id:
                    true,

                  name:
                    true,

                  items: {
                    select: {
                      percentage:
                        true,

                      ingredient: {
                        select: {
                          id:
                            true,

                          name:
                            true,

                          isActive:
                            true,
                        },
                      },
                    },
                  },
                },
              });

            if (
              activeFormula
            ) {
              if (
                activeFormula.items
                  .length === 0 ||
                activeFormula.items.some(
                  (
                    item,
                  ) =>
                    !item.ingredient
                      .isActive,
                )
              ) {
                throw ruleError(
                  "Formula pakan aktif tidak valid. Hubungi Owner untuk memperbaiki formula.",
                );
              }

              assertFormulaComplete(
                activeFormula.items.reduce(
                  (
                    total,
                    item,
                  ) =>
                    total +
                    percentageToBasisPoints(
                      item.percentage.toString(),
                    ),
                  0,
                ),
              );

              const items =
                await Promise.all(
                  activeFormula.items.map(
                    async (
                      item,
                    ): Promise<SnapshotItem> => {
                      const cost =
                        await resolveFeedUnitCostForDate(
                          {
                            farmId:
                              kandang.farmId,

                            ingredientId:
                              item.ingredient.id,

                            date:
                              reportDate,
                          },

                          tx,
                        );

                      return {
                        ingredientId:
                          item.ingredient.id,

                        ingredientNameSnapshot:
                          item.ingredient.name,

                        percentage:
                          item.percentage.toString(),

                        unitCostPerKgSnapshot:
                          cost.unitCostPerKg,

                        costBasisSnapshot:
                          cost.basis,
                      };
                    },
                  ),
                );

              snapshot = {
                formulaId:
                  activeFormula.id,

                formulaNameSnapshot:
                  activeFormula.name,

                items,
              };
            }
          }

          /*
           * Actual composition dapat mengganti
           * persentase maupun menambah/menghapus
           * ingredient.
           *
           * Ingredient yang sudah ada di report
           * mempertahankan historical cost snapshot.
           * Ingredient benar-benar baru resolve
           * berdasarkan DailyReport.date.
           */
          if (
            parsed.feedCompositionOverride
          ) {
            if (
              !snapshot
            ) {
              throw ruleError(
                "Tidak ada formula pakan yang dapat digunakan sebagai dasar komposisi aktual.",
              );
            }

            const existingItemByIngredient =
              new Map(
                snapshot.items.map(
                  (
                    item,
                  ) => [
                    item.ingredientId,
                    item,
                  ],
                ),
              );

            const newIngredientIds =
              parsed.feedComposition
                .map(
                  (
                    item,
                  ) =>
                    item.ingredientId,
                )
                .filter(
                  (
                    ingredientId,
                  ) =>
                    !existingItemByIngredient.has(
                      ingredientId,
                    ),
                );

            const newIngredients =
              newIngredientIds.length >
              0
                ? await tx.feedIngredient.findMany({
                    where: {
                      farmId:
                        kandang.farmId,

                      isActive:
                        true,

                      id: {
                        in:
                          newIngredientIds,
                      },
                    },

                    select: {
                      id:
                        true,

                      name:
                        true,
                    },
                  })
                : [];

            if (
              newIngredients.length !==
              newIngredientIds.length
            ) {
              throw ruleError(
                "Komposisi aktual mengandung bahan pakan yang tidak valid atau sudah nonaktif.",
              );
            }

            const newIngredientById =
              new Map(
                newIngredients.map(
                  (
                    ingredient,
                  ) => [
                    ingredient.id,
                    ingredient,
                  ],
                ),
              );

            const nextItems =
              await Promise.all(
                parsed.feedComposition.map(
                  async (
                    compositionItem,
                  ): Promise<SnapshotItem> => {
                    const existingItem =
                      existingItemByIngredient.get(
                        compositionItem.ingredientId,
                      );

                    if (
                      existingItem
                    ) {
                      return {
                        ...existingItem,

                        percentage:
                          compositionItem.percentage,
                      };
                    }

                    const ingredient =
                      newIngredientById.get(
                        compositionItem.ingredientId,
                      );

                    if (
                      !ingredient
                    ) {
                      throw ruleError(
                        "Bahan pakan baru pada komposisi aktual tidak ditemukan.",
                      );
                    }

                    const cost =
                      await resolveFeedUnitCostForDate(
                        {
                          farmId:
                            kandang.farmId,

                          ingredientId:
                            ingredient.id,

                          date:
                            reportDate,
                        },

                        tx,
                      );

                    return {
                      ingredientId:
                        ingredient.id,

                      ingredientNameSnapshot:
                        ingredient.name,

                      percentage:
                        compositionItem.percentage,

                      unitCostPerKgSnapshot:
                        cost.unitCostPerKg,

                      costBasisSnapshot:
                        cost.basis,
                    };
                  },
                ),
              );

            snapshot = {
              ...snapshot,

              items:
                nextItems,
            };
          }

          if (
            parsed.feedUsed !==
              null &&
            !snapshot
          ) {
            throw ruleError(
              "Pakan Digunakan sudah diisi, tetapi belum ada formula pakan aktif. Hubungi Owner untuk mengaktifkan formula.",
            );
          }

          // Validasi mortality tidak boleh melebihi sisa populasi aktif (REL-011 / DT-008 / BUG-006)
          if (
            parsed.mortality !== null &&
            parsed.mortality > 0
          ) {
            const priorMortalityAgg =
              await tx.dailyReport.aggregate({
                where: {
                  flockId:
                    kandang.activeFlock.id,
                  date: {
                    lt: reportDate,
                  },
                  mortality: {
                    not: null,
                  },
                },
                _sum: {
                  mortality: true,
                },
              });

            const priorMortality =
              priorMortalityAgg._sum.mortality ?? 0;
            const remainingPopulation =
              kandang.activeFlock.initialPopulation -
              priorMortality;

            if (parsed.mortality > remainingPopulation) {
              throw ruleError(
                `Jumlah kematian (${parsed.mortality} ekor) tidak boleh melebihi sisa populasi aktif (${remainingPopulation} ekor).`,
              );
            }
          }

          const report =
            await tx.dailyReport.upsert({
              where: {
                date_kandangId: {
                  date:
                    reportDate,

                  kandangId:
                    kandang.id,
                },
              },

              create: {
                date:
                  reportDate,

                kandangId:
                  kandang.id,

                flockId:
                  kandang.activeFlock.id,

                operatorId:
                  user.id,

                saleableEgg:
                  parsed.saleableEgg,

                damagedEgg:
                  parsed.damagedEgg,

                feedUsed:
                  parsed.feedUsed,

                mortality:
                  parsed.mortality,

                incidentalExpense:
                  parsed.incidentalExpense,

                incidentalExpenseCategory:
                  parsed.incidentalExpenseCategory,

                incidentNote:
                  parsed.incidentNote,

                feedFormulaId:
                  snapshot?.formulaId ??
                  null,

                feedFormulaNameSnapshot:
                  snapshot?.formulaNameSnapshot ??
                  null,
              },

              update: {
                saleableEgg:
                  parsed.saleableEgg,

                damagedEgg:
                  parsed.damagedEgg,

                feedUsed:
                  parsed.feedUsed,

                mortality:
                  parsed.mortality,

                incidentalExpense:
                  parsed.incidentalExpense,

                incidentalExpenseCategory:
                  parsed.incidentalExpenseCategory,

                incidentNote:
                  parsed.incidentNote,

                feedFormulaId:
                  snapshot?.formulaId ??
                  null,

                feedFormulaNameSnapshot:
                  snapshot?.formulaNameSnapshot ??
                  null,
              },

              select: {
                id:
                  true,

                saleableEgg:
                  true,

                damagedEgg:
                  true,

                feedUsed:
                  true,

                mortality:
                  true,
              },
            });

          /*
           * Existing DB rows memang diganti sebagai
           * composition snapshot, tetapi nilai historical
           * cost untuk ingredient yang bertahan sudah
           * dicopy ke `snapshot` di atas.
           */
          await tx.dailyReportFeedItem.deleteMany({
            where: {
              dailyReportId:
                report.id,
            },
          });

          if (
            snapshot &&
            snapshot.items
              .length > 0
          ) {
            await tx.dailyReportFeedItem.createMany({
              data:
                snapshot.items.map(
                  (
                    item,
                  ) => ({
                    dailyReportId:
                      report.id,

                    ingredientId:
                      item.ingredientId,

                    ingredientNameSnapshot:
                      item.ingredientNameSnapshot,

                    percentage:
                      item.percentage,

                    unitCostPerKgSnapshot:
                      item.unitCostPerKgSnapshot,

                    costBasisSnapshot:
                      item.costBasisSnapshot,
                  }),
                ),
            });
          }

          return report;
        },
      );

    const status =
      getDailyReportStatus(
        saved,
      );

    revalidatePath(
      TODAY_PATH,
    );

    revalidatePath(
      HISTORY_PATH,
    );

    revalidatePath(
      OWNER_DAILY_PATH,
    );

    revalidatePath(
      FEED_PATH,
    );

    revalidatePath(
      EXPENSES_PATH,
    );

    return {
      success: true,
      status,

      message:
        status ===
        "COMPLETE"
          ? "Laporan hari ini berhasil disimpan dan selesai."
          : "Draft laporan berhasil disimpan.",
    };
  } catch (
    error
  ) {
    return handleActionError(
      error,
    );
  }
}

export async function saveDailyReportDraft(
  input: DailyReportFormInput,
): Promise<DailyReportActionResult> {
  return saveReport(
    input,
    false,
  );
}

export async function completeDailyReport(
  input: DailyReportFormInput,
): Promise<DailyReportActionResult> {
  return saveReport(
    input,
    true,
  );
}