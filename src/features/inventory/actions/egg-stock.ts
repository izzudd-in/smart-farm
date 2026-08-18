"use server";

import { revalidatePath } from "next/cache";

import {
  EggStockAdjustmentType,
  UserRole,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import {
  InventoryValidationError,
  parseEggAdjustmentInput,
  parseEggOpeningInput,
} from "@/features/inventory/schemas/egg-stock";
import type {
  EggAdjustmentInput,
  EggOpeningInput,
  InventoryActionResult,
} from "@/features/inventory/types/inventory";

const INVENTORY_PATH =
  "/inventory";

function ruleError(
  message: string,
): Error {
  return new Error(
    `INVENTORY_RULE:${message}`,
  );
}

function databaseErrorCode(
  error: unknown,
): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

function handleError(
  error: unknown,
): InventoryActionResult {
  if (
    error instanceof
    InventoryValidationError
  ) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "INVENTORY_RULE:",
    )
  ) {
    return {
      success: false,

      error:
        error.message.replace(
          "INVENTORY_RULE:",
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

  if (
    databaseErrorCode(
      error,
    ) === "P2002"
  ) {
    return {
      success: false,

      error:
        "Stok awal untuk farm ini sudah pernah dibuat.",
    };
  }

  console.error(error);

  return {
    success: false,

    error:
      "Terjadi kesalahan saat menyimpan movement stok.",
  };
}

export async function createEggOpeningStock(
  input: EggOpeningInput,
): Promise<InventoryActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseEggOpeningInput(
        input,
      );

    await prisma.$transaction(
      async (tx) => {
        const farm =
          await tx.farm.findUnique({
            where: {
              scope: "PRIMARY",
            },

            select: {
              id: true,
              isActive: true,
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
          await tx.eggStockAdjustment.findUnique({
            where: {
              openingKey:
                farm.id,
            },

            select: {
              id: true,
            },
          });

        if (existing) {
          throw ruleError(
            "Stok awal sudah pernah dibuat.",
          );
        }

        await tx.eggStockAdjustment.create({
          data: {
            farmId:
              farm.id,

            occurredAt:
              parsed.occurredAt,

            type:
              EggStockAdjustmentType.OPENING,

            quantityKg:
              parsed.quantityKg,

            note:
              parsed.note,

            createdById:
              user.id,

            openingKey:
              farm.id,
          },
        });
      },
    );

    revalidatePath(
      INVENTORY_PATH,
    );

    return {
      success: true,

      message:
        "Stok awal berhasil dicatat.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}

export async function createEggStockAdjustment(
  input: EggAdjustmentInput,
): Promise<InventoryActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseEggAdjustmentInput(
        input,
      );

    const farm =
      await prisma.farm.findUnique({
        where: {
          scope: "PRIMARY",
        },

        select: {
          id: true,
          isActive: true,
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

    await prisma.eggStockAdjustment.create({
      data: {
        farmId:
          farm.id,

        occurredAt:
          parsed.occurredAt,

        type:
          parsed.type ===
          "INCREASE"
            ? EggStockAdjustmentType.INCREASE
            : EggStockAdjustmentType.DECREASE,

        quantityKg:
          parsed.quantityKg,

        note:
          parsed.note,

        createdById:
          user.id,

        openingKey: null,
      },
    });

    revalidatePath(
      INVENTORY_PATH,
    );

    return {
      success: true,

      message:
        "Koreksi stok berhasil dicatat.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}