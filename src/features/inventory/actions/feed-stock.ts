"use server";

import { revalidatePath } from "next/cache";

import {
  FeedStockAdjustmentType,
  UserRole,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import {
  InventoryValidationError,
} from "@/features/inventory/schemas/egg-stock";

import {
  parseFeedAdjustmentInput,
  parseFeedOpeningInput,
  parseFeedPurchaseInput,
} from "@/features/inventory/schemas/feed-stock";

import type {
  FeedAdjustmentInput,
  FeedOpeningInput,
  FeedPurchaseInput,
  InventoryActionResult,
} from "@/features/inventory/types/inventory";

import {
  calculateFeedPurchaseTotal,
} from "@/features/inventory/utils/feed-stock";

const INVENTORY_PATH =
  "/inventory";

function ruleError(
  message: string,
): Error {
  return new Error(
    `FEED_INVENTORY_RULE:${message}`,
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
      "FEED_INVENTORY_RULE:",
    )
  ) {
    return {
      success: false,

      error:
        error.message.replace(
          "FEED_INVENTORY_RULE:",
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
        "Stok awal bahan pakan tersebut sudah pernah dibuat.",
    };
  }

  console.error(error);

  return {
    success: false,

    error:
      "Terjadi kesalahan saat menyimpan Feed Inventory.",
  };
}

export async function createFeedPurchase(
  input: FeedPurchaseInput,
): Promise<InventoryActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseFeedPurchaseInput(
        input,
      );

    const totalPrice =
      calculateFeedPurchaseTotal(
        parsed.quantityKg,
        parsed.unitPricePerKg,
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

        const ingredient =
          await tx.feedIngredient.findFirst({
            where: {
              id:
                parsed.ingredientId,

              farmId:
                farm.id,

              isActive: true,
            },

            select: {
              id: true,
            },
          });

        if (!ingredient) {
          throw ruleError(
            "Bahan pakan tidak tersedia, tidak aktif, atau bukan milik farm utama.",
          );
        }

        await tx.feedPurchase.create({
          data: {
            farmId:
              farm.id,

            ingredientId:
              ingredient.id,

            purchasedAt:
              parsed.purchasedAt,

            quantityKg:
              parsed.quantityKg,

            unitPricePerKg:
              parsed.unitPricePerKg,

            totalPrice,

            supplier:
              parsed.supplier,

            note:
              parsed.note,

            createdById:
              user.id,
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
        "Pembelian pakan berhasil dicatat.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}

export async function createFeedOpeningStock(
  input: FeedOpeningInput,
): Promise<InventoryActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseFeedOpeningInput(
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

        const ingredient =
          await tx.feedIngredient.findFirst({
            where: {
              id:
                parsed.ingredientId,

              farmId:
                farm.id,
            },

            select: {
              id: true,
            },
          });

        if (!ingredient) {
          throw ruleError(
            "Bahan pakan tidak ditemukan.",
          );
        }

        const existing =
          await tx.feedStockAdjustment.findUnique({
            where: {
              openingKey:
                ingredient.id,
            },

            select: {
              id: true,
            },
          });

        if (existing) {
          throw ruleError(
            "Stok awal bahan pakan tersebut sudah pernah dibuat.",
          );
        }

        await tx.feedStockAdjustment.create({
          data: {
            farmId:
              farm.id,

            ingredientId:
              ingredient.id,

            occurredAt:
              parsed.occurredAt,

            type:
              FeedStockAdjustmentType.OPENING,

            quantityKg:
              parsed.quantityKg,

            note:
              parsed.note,

            createdById:
              user.id,

            openingKey:
              ingredient.id,
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
        "Stok awal bahan pakan berhasil dicatat.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}

export async function createFeedStockAdjustment(
  input: FeedAdjustmentInput,
): Promise<InventoryActionResult> {
  try {
    const user =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseFeedAdjustmentInput(
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

        const ingredient =
          await tx.feedIngredient.findFirst({
            where: {
              id:
                parsed.ingredientId,

              farmId:
                farm.id,
            },

            select: {
              id: true,
            },
          });

        if (!ingredient) {
          throw ruleError(
            "Bahan pakan tidak ditemukan.",
          );
        }

        await tx.feedStockAdjustment.create({
          data: {
            farmId:
              farm.id,

            ingredientId:
              ingredient.id,

            occurredAt:
              parsed.occurredAt,

            type:
              parsed.type ===
              "INCREASE"
                ? FeedStockAdjustmentType.INCREASE
                : FeedStockAdjustmentType.DECREASE,

            quantityKg:
              parsed.quantityKg,

            note:
              parsed.note,

            createdById:
              user.id,

            openingKey:
              null,
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
        "Koreksi stok pakan berhasil dicatat.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}