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
  parseRoutineCostInput,
  RoutineCostValidationError,
} from "@/features/expenses/schemas/routine-cost";

import type {
  RoutineCostActionResult,
  RoutineCostInput,
} from "@/features/expenses/types/routine-cost";

const EXPENSES_PATH =
  "/expenses";

const DASHBOARD_PATH =
  "/dashboard";

const HPP_PATH =
  "/hpp";

const REPORTS_PATH =
  "/reports";

function revalidateRelatedPaths() {
  revalidatePath(EXPENSES_PATH);
  revalidatePath(DASHBOARD_PATH);
  revalidatePath(HPP_PATH);
  revalidatePath(REPORTS_PATH);
}

function ruleError(
  message: string,
): Error {
  return new Error(
    `ROUTINE_COST_RULE:${message}`,
  );
}

function handleError(
  error: unknown,
): RoutineCostActionResult {
  if (
    error instanceof
    RoutineCostValidationError
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
      "ROUTINE_COST_RULE:",
    )
  ) {
    return {
      success:
        false,

      error:
        error.message.replace(
          "ROUTINE_COST_RULE:",
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
      "Terjadi kesalahan saat menyimpan biaya rutin.",
  };
}

export async function createRoutineCost(
  input: RoutineCostInput,
): Promise<RoutineCostActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseRoutineCostInput(
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

        await tx.routineCost.create({
          data: {
            farmId:
              farm.id,

            category:
              parsed.category,

            name:
              parsed.name,

            amount:
              parsed.amount,

            periodStart:
              parsed.periodStart,

            periodEnd:
              parsed.periodEnd,

            note:
              parsed.note,

            createdById:
              user.id,
          },
        });
      },
    );

    revalidateRelatedPaths();

    return {
      success:
        true,

      message:
        "Biaya rutin berhasil ditambahkan.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}

export async function updateRoutineCost(
  routineCostId: string,
  input: RoutineCostInput,
): Promise<RoutineCostActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const id =
      routineCostId.trim();

    if (!id) {
      throw ruleError(
        "Biaya rutin tidak ditemukan.",
      );
    }

    const parsed =
      parseRoutineCostInput(
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
          await tx.routineCost.findFirst({
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
            "Biaya rutin tidak ditemukan.",
          );
        }

        await tx.routineCost.update({
          where: {
            id:
              existing.id,
          },

          data: {
            category:
              parsed.category,

            name:
              parsed.name,

            amount:
              parsed.amount,

            periodStart:
              parsed.periodStart,

            periodEnd:
              parsed.periodEnd,

            note:
              parsed.note,
          },
        });
      },
    );

    revalidateRelatedPaths();

    return {
      success:
        true,

      message:
        "Biaya rutin berhasil diperbarui.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}

export async function deleteRoutineCost(
  routineCostId: string,
): Promise<RoutineCostActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const id =
      routineCostId.trim();

    if (!id) {
      throw ruleError(
        "Biaya rutin tidak ditemukan.",
      );
    }

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
          await tx.routineCost.findFirst({
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
            "Biaya rutin tidak ditemukan.",
          );
        }

        await tx.routineCost.delete({
          where: {
            id:
              existing.id,
          },
        });
      },
    );

    revalidateRelatedPaths();

    return {
      success:
        true,

      message:
        "Biaya rutin berhasil dihapus.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}