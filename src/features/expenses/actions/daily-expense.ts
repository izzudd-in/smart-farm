"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  UserRole,
} from "@/generated/prisma/enums";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireRole,
} from "@/server/auth/guards";

import {
  DailyExpenseValidationError,
  parseDailyExpenseInput,
} from "@/features/expenses/schemas/daily-expense";

import type {
  DailyExpenseActionResult,
  DailyExpenseInput,
} from "@/features/expenses/types/daily-expense";

const EXPENSES_PATH =
  "/expenses";

const DASHBOARD_PATH =
  "/dashboard";

function ruleError(
  message: string,
): Error {
  return new Error(
    `DAILY_EXPENSE_RULE:${message}`,
  );
}

function handleError(
  error: unknown,
): DailyExpenseActionResult {
  if (
    error instanceof
    DailyExpenseValidationError
  ) {
    return {
      success:
        false,

      error:
        error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "DAILY_EXPENSE_RULE:",
    )
  ) {
    return {
      success:
        false,

      error:
        error.message.replace(
          "DAILY_EXPENSE_RULE:",
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
      success:
        false,

      error:
        "Akses ditolak.",
    };
  }

  console.error(
    error,
  );

  return {
    success:
      false,

    error:
      "Terjadi kesalahan saat menyimpan pengeluaran.",
  };
}

export async function createDailyExpense(
  input: DailyExpenseInput,
): Promise<DailyExpenseActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseDailyExpenseInput(
        input,
      );

    await prisma.$transaction(
      async (
        tx,
      ) => {
        const farm =
          await tx.farm.findUnique({
            where: {
              scope:
                "PRIMARY",
            },

            select: {
              id:
                true,

              isActive:
                true,
            },
          });

        if (
          !farm ||
          !farm.isActive
        ) {
          throw ruleError(
            "Farm utama tidak tersedia atau tidak aktif.",
          );
        }

        await tx.dailyExpense.create({
          data: {
            farmId:
              farm.id,

            category:
              parsed.category,

            amount:
              parsed.amount,

            occurredAt:
              parsed.occurredAt,

            description:
              parsed.description,

            createdById:
              user.id,
          },
        });
      },
    );

    revalidatePath(
      EXPENSES_PATH,
    );

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

      message:
        "Pengeluaran berhasil ditambahkan.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}

export async function updateDailyExpense(
  dailyExpenseId: string,
  input: DailyExpenseInput,
): Promise<DailyExpenseActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const id =
      dailyExpenseId.trim();

    if (!id) {
      throw ruleError(
        "Pengeluaran tidak ditemukan.",
      );
    }

    const parsed =
      parseDailyExpenseInput(
        input,
      );

    await prisma.$transaction(
      async (
        tx,
      ) => {
        const farm =
          await tx.farm.findUnique({
            where: {
              scope:
                "PRIMARY",
            },

            select: {
              id:
                true,

              isActive:
                true,
            },
          });

        if (
          !farm ||
          !farm.isActive
        ) {
          throw ruleError(
            "Farm utama tidak tersedia atau tidak aktif.",
          );
        }

        const existing =
          await tx.dailyExpense.findFirst({
            where: {
              id,

              farmId:
                farm.id,
            },

            select: {
              id:
                true,
            },
          });

        if (
          !existing
        ) {
          throw ruleError(
            "Pengeluaran tidak ditemukan.",
          );
        }

        await tx.dailyExpense.update({
          where: {
            id:
              existing.id,
          },

          data: {
            category:
              parsed.category,

            amount:
              parsed.amount,

            occurredAt:
              parsed.occurredAt,

            description:
              parsed.description,
          },
        });
      },
    );

    revalidatePath(
      EXPENSES_PATH,
    );

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

      message:
        "Pengeluaran berhasil diperbarui.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}