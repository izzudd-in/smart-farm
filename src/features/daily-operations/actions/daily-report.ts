"use server";

import { revalidatePath } from "next/cache";

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import {
  DailyReportValidationError,
  parseDailyReportInput,
} from "@/features/daily-operations/schemas/daily-report";
import type {
  DailyReportActionResult,
  DailyReportFormInput,
} from "@/features/daily-operations/types/daily-report";
import { getJakartaTodayDate } from "@/features/daily-operations/utils/date";
import { getDailyReportStatus } from "@/features/daily-operations/utils/status";
import {
  assertFormulaComplete,
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";

const TODAY_PATH =
  "/operator/today";

const HISTORY_PATH =
  "/operator/history";

const OWNER_DAILY_PATH =
  "/daily";

const FEED_PATH =
  "/feed";

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
      error: error.message,
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

      error: error.message.replace(
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
    ].includes(error.message)
  ) {
    return {
      success: false,
      error: "Akses ditolak.",
    };
  }

  console.error(error);

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
        async (tx) => {
          const kandang =
            await tx.kandang.findFirst({
              where: {
                id: parsed.kandangId,
                isActive: true,

                operators: {
                  some: {
                    id: user.id,
                  },
                },
              },

              select: {
                id: true,
                farmId: true,

                activeFlock: {
                  select: {
                    id: true,
                    startDate: true,
                  },
                },
              },
            });

          if (!kandang) {
            throw ruleError(
              "Kandang tidak ditemukan, tidak aktif, atau tidak di-assign kepada Anda.",
            );
          }

          if (!kandang.activeFlock) {
            throw ruleError(
              "Kandang belum memiliki flock aktif.",
            );
          }

          if (
            reportDate <
            kandang.activeFlock.startDate
          ) {
            throw ruleError(
              "Laporan tidak boleh dibuat sebelum flock dimulai.",
            );
          }

          const existing =
            await tx.dailyReport.findUnique({
              where: {
                date_kandangId: {
                  date: reportDate,
                  kandangId:
                    kandang.id,
                },
              },

              select: {
                id: true,
                flockId: true,
                operatorId: true,

                feedFormulaId: true,
                feedFormulaNameSnapshot:
                  true,

                operator: {
                  select: {
                    name: true,
                  },
                },

                feedItems: {
                  orderBy: {
                    ingredientNameSnapshot:
                      "asc",
                  },

                  select: {
                    ingredientId: true,
                    ingredientNameSnapshot:
                      true,
                    percentage: true,
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
            ingredientId: string;
            ingredientNameSnapshot: string;
            percentage: string;
          };

          type Snapshot = {
            formulaId: string | null;
            formulaNameSnapshot: string;
            items: SnapshotItem[];
          };

          let snapshot:
            Snapshot | null = null;

          const hasExistingSnapshot =
            Boolean(
              existing &&
                existing.feedItems
                  .length > 0,
            );

          if (
            existing &&
            hasExistingSnapshot
          ) {
            snapshot = {
              formulaId:
                existing.feedFormulaId,

              formulaNameSnapshot:
                existing.feedFormulaNameSnapshot ??
                "Formula Tersimpan",

              items:
                existing.feedItems.map(
                  (item) => ({
                    ingredientId:
                      item.ingredientId,

                    ingredientNameSnapshot:
                      item.ingredientNameSnapshot,

                    percentage:
                      item.percentage.toString(),
                  }),
                ),
            };
          } else {
            const activeFormula =
              await tx.feedFormula.findFirst({
                where: {
                  farmId:
                    kandang.farmId,

                  isActive: true,
                },

                select: {
                  id: true,
                  name: true,

                  items: {
                    select: {
                      percentage: true,

                      ingredient: {
                        select: {
                          id: true,
                          name: true,
                          isActive: true,
                        },
                      },
                    },
                  },
                },
              });

            if (activeFormula) {
              if (
                activeFormula.items
                  .length === 0 ||
                activeFormula.items.some(
                  (item) =>
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
                  (total, item) =>
                    total +
                    percentageToBasisPoints(
                      item.percentage.toString(),
                    ),
                  0,
                ),
              );

              snapshot = {
                formulaId:
                  activeFormula.id,

                formulaNameSnapshot:
                  activeFormula.name,

                items:
                  activeFormula.items.map(
                    (item) => ({
                      ingredientId:
                        item.ingredient.id,

                      ingredientNameSnapshot:
                        item.ingredient.name,

                      percentage:
                        item.percentage.toString(),
                    }),
                  ),
              };
            }
          }

          if (
            parsed.feedCompositionOverride
          ) {
            if (!snapshot) {
              throw ruleError(
                "Tidak ada formula pakan yang dapat digunakan sebagai dasar komposisi aktual.",
              );
            }

            const expectedIds =
              new Set(
                snapshot.items.map(
                  (item) =>
                    item.ingredientId,
                ),
              );

            const actualIds =
              new Set(
                parsed.feedComposition.map(
                  (item) =>
                    item.ingredientId,
                ),
              );

            if (
              expectedIds.size !==
                actualIds.size ||
              Array.from(
                expectedIds,
              ).some(
                (ingredientId) =>
                  !actualIds.has(
                    ingredientId,
                  ),
              )
            ) {
              throw ruleError(
                "Override komposisi hanya boleh mengubah persentase bahan dari formula yang digunakan.",
              );
            }

            snapshot = {
              ...snapshot,

              items:
                snapshot.items.map(
                  (baseItem) => {
                    const override =
                      parsed.feedComposition.find(
                        (item) =>
                          item.ingredientId ===
                          baseItem.ingredientId,
                      );

                    if (!override) {
                      throw ruleError(
                        "Komposisi aktual tidak lengkap.",
                      );
                    }

                    return {
                      ...baseItem,

                      percentage:
                        override.percentage,
                    };
                  },
                ),
            };
          }

          if (
            parsed.feedUsed !== null &&
            !snapshot
          ) {
            throw ruleError(
              "Pakan Digunakan sudah diisi, tetapi belum ada formula pakan aktif. Hubungi Owner untuk mengaktifkan formula.",
            );
          }

          const report =
            await tx.dailyReport.upsert({
              where: {
                date_kandangId: {
                  date: reportDate,

                  kandangId:
                    kandang.id,
                },
              },

              create: {
                date: reportDate,

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
                id: true,
                saleableEgg: true,
                damagedEgg: true,
                feedUsed: true,
                mortality: true,
              },
            });

          await tx.dailyReportFeedItem.deleteMany({
            where: {
              dailyReportId:
                report.id,
            },
          });

          if (
            snapshot &&
            snapshot.items.length > 0
          ) {
            await tx.dailyReportFeedItem.createMany({
              data:
                snapshot.items.map(
                  (item) => ({
                    dailyReportId:
                      report.id,

                    ingredientId:
                      item.ingredientId,

                    ingredientNameSnapshot:
                      item.ingredientNameSnapshot,

                    percentage:
                      item.percentage,
                  }),
                ),
            });
          }

          return report;
        },
      );

    const status =
      getDailyReportStatus(saved);

    revalidatePath(TODAY_PATH);
    revalidatePath(HISTORY_PATH);
    revalidatePath(OWNER_DAILY_PATH);
    revalidatePath(FEED_PATH);

    return {
      success: true,
      status,

      message:
        status === "COMPLETE"
          ? "Laporan hari ini berhasil disimpan dan selesai."
          : "Draft laporan berhasil disimpan.",
    };
  } catch (error) {
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