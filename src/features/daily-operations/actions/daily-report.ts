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

const TODAY_PATH =
  "/operator/today";

const HISTORY_PATH =
  "/operator/history";

const OWNER_DAILY_PATH =
  "/daily";

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
    const user = await requireRole(
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

                operator: {
                  select: {
                    name: true,
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

          return tx.dailyReport.upsert({
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
            },

            select: {
              saleableEgg: true,
              damagedEgg: true,
              feedUsed: true,
              mortality: true,
            },
          });
        },
      );

    const status =
      getDailyReportStatus(saved);

    revalidatePath(TODAY_PATH);
    revalidatePath(HISTORY_PATH);
    revalidatePath(OWNER_DAILY_PATH);

    return {
      success: true,

      status,

      message:
        status === "COMPLETE"
          ? "Laporan hari ini berhasil disimpan dan selesai."
          : "Draft laporan berhasil disimpan.",
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function saveDailyReportDraft(
  input: DailyReportFormInput,
): Promise<DailyReportActionResult> {
  return saveReport(input, false);
}

export async function completeDailyReport(
  input: DailyReportFormInput,
): Promise<DailyReportActionResult> {
  return saveReport(input, true);
}