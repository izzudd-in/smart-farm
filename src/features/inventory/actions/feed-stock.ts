"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  FeedStockAdjustmentType,
  UserRole,
} from "@/generated/prisma/enums";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  requireRole,
} from "@/server/auth/guards";

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

const DASHBOARD_PATH =
  "/dashboard";

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
    typeof error ===
      "object" &&
    error !==
      null &&
    "code" in
      error &&
    typeof error.code ===
      "string"
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
      success:
        false,

      error:
        error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "FEED_INVENTORY_RULE:",
    )
  ) {
    return {
      success:
        false,

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

  if (
    databaseErrorCode(
      error,
    ) ===
    "P2002"
  ) {
    return {
      success:
        false,

      error:
        "Stok awal bahan pakan tersebut sudah pernah dibuat.",
    };
  }

  console.error(
    error,
  );

  return {
    success:
      false,

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

        const ingredient =
          await tx.feedIngredient.findFirst({
            where: {
              id:
                parsed.ingredientId,

              farmId:
                farm.id,

              isActive:
                true,
            },

            select: {
              id:
                true,
            },
          });

        if (
          !ingredient
        ) {
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

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

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

        const ingredient =
          await tx.feedIngredient.findFirst({
            where: {
              id:
                parsed.ingredientId,

              farmId:
                farm.id,
            },

            select: {
              id:
                true,
            },
          });

        if (
          !ingredient
        ) {
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
              id:
                true,
            },
          });

        if (
          existing
        ) {
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

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

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

        const ingredient =
          await tx.feedIngredient.findFirst({
            where: {
              id:
                parsed.ingredientId,

              farmId:
                farm.id,
            },

            select: {
              id:
                true,
            },
          });

        if (
          !ingredient
        ) {
          throw ruleError(
            "Bahan pakan tidak ditemukan.",
          );
        }

        // Validasi pencegahan stok pakan negatif (REL-023 / DT-007 / BUG-007)
        if (parsed.type === "DECREASE") {
          const [purchaseAgg, adjustmentAgg, usageReports] =
            await Promise.all([
              tx.feedPurchase.aggregate({
                where: {
                  ingredientId: ingredient.id,
                  purchasedAt: {
                    lte: parsed.occurredAt,
                  },
                  farmId: farm.id,
                },
                _sum: {
                  quantityKg: true,
                },
              }),
              tx.feedStockAdjustment.groupBy({
                by: ["type"],
                where: {
                  ingredientId: ingredient.id,
                  occurredAt: {
                    lte: parsed.occurredAt,
                  },
                  farmId: farm.id,
                },
                _sum: {
                  quantityKg: true,
                },
              }),
              tx.dailyReport.findMany({
                where: {
                  date: {
                    lte: parsed.occurredAt,
                  },
                  kandang: {
                    farmId: farm.id,
                  },
                  saleableEgg: {
                    not: null,
                  },
                  damagedEgg: {
                    not: null,
                  },
                  feedUsed: {
                    not: null,
                  },
                  mortality: {
                    not: null,
                  },
                  feedItems: {
                    some: {
                      ingredientId:
                        ingredient.id,
                    },
                  },
                },
                select: {
                  feedUsed: true,
                  feedItems: {
                    where: {
                      ingredientId:
                        ingredient.id,
                    },
                    select: {
                      percentage:
                        true,
                    },
                  },
                },
              }),
            ]);

          let availableMilliKg = BigInt(
            Math.round(
              Number(
                purchaseAgg._sum
                  .quantityKg ?? 0,
              ) * 1000,
            ),
          );

          for (const adj of adjustmentAgg) {
            const qtyMilliKg = BigInt(
              Math.round(
                Number(
                  adj._sum
                    .quantityKg ?? 0,
                ) * 1000,
              ),
            );
            if (
              adj.type ===
                FeedStockAdjustmentType.OPENING ||
              adj.type ===
                FeedStockAdjustmentType.INCREASE
            ) {
              availableMilliKg +=
                qtyMilliKg;
            } else if (
              adj.type ===
              FeedStockAdjustmentType.DECREASE
            ) {
              availableMilliKg -=
                qtyMilliKg;
            }
          }

          for (const rep of usageReports) {
            if (
              rep.feedUsed &&
              rep.feedItems[0]?.percentage
            ) {
              const feedMilliKg = BigInt(
                Math.round(
                  rep.feedUsed *
                    1000,
                ),
              );
              const basisPoints = BigInt(
                Math.round(
                  Number(
                    rep.feedItems[0]
                      .percentage,
                  ) * 100,
                ),
              );
              const usageMilliKg =
                (feedMilliKg *
                  basisPoints) /
                BigInt(10000);
              availableMilliKg -=
                usageMilliKg;
            }
          }

          const decrMilliKg = BigInt(
            Math.round(
              Number(
                parsed.quantityKg,
              ) * 1000,
            ),
          );

          if (
            decrMilliKg > availableMilliKg
          ) {
            const availableKg =
              Number(
                availableMilliKg >
                  BigInt(0)
                  ? availableMilliKg
                  : BigInt(0),
              ) / 1000;
            throw ruleError(
              `Stok pakan tidak mencukupi untuk koreksi pengurangan. Stok saat ini: ${availableKg} kg, pengurangan diminta: ${parsed.quantityKg} kg.`,
            );
          }
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

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

      message:
        "Koreksi stok pakan berhasil dicatat.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}