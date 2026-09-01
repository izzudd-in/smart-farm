"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  EggStockAdjustmentType,
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
  parseEggAdjustmentInput,
  parseEggOpeningInput,
} from "@/features/inventory/schemas/egg-stock";

import type {
  EggAdjustmentInput,
  EggOpeningInput,
  InventoryActionResult,
} from "@/features/inventory/types/inventory";

import {
  getCompleteDailyReportStockWhere,
} from "@/features/inventory/queries/stock-source-filters";

import {
  quantityToMilliKg,
} from "@/features/inventory/utils/quantity";

const INVENTORY_PATH =
  "/inventory";

const DASHBOARD_PATH =
  "/dashboard";

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
      "INVENTORY_RULE:",
    )
  ) {
    return {
      success:
        false,

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
        "Stok awal sudah pernah dibuat.",
    };
  }

  console.error(
    error,
  );

  return {
    success:
      false,

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
          await tx.eggStockAdjustment.findUnique({
            where: {
              openingKey:
                farm.id,
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

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

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

    await prisma.$transaction(
      async (tx) => {
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

        if (parsed.type === "DECREASE") {
          const [
            production,
            sales,
            adjustments,
          ] = await Promise.all([
            tx.dailyReport.aggregate({
              where:
                getCompleteDailyReportStockWhere(
                  parsed.occurredAt,
                ),
              _sum: {
                saleableEgg:
                  true,
              },
            }),
            tx.order.aggregate({
              where: {
                orderedAt: {
                  lte: parsed.occurredAt,
                },
                farmId: farm.id,
              },
              _sum: {
                quantityKg:
                  true,
              },
            }),
            tx.eggStockAdjustment.groupBy({
              by: ["type"],
              where: {
                occurredAt: {
                  lte: parsed.occurredAt,
                },
                farmId: farm.id,
              },
              _sum: {
                quantityKg:
                  true,
              },
            }),
          ]);

          const productionMilliKg =
            quantityToMilliKg(
              production._sum
                .saleableEgg ?? 0,
            );

          const salesMilliKg =
            quantityToMilliKg(
              sales._sum
                .quantityKg
                ?.toString() ??
                "0",
            );

          let openingMilliKg = BigInt(0);
          let increaseMilliKg = BigInt(0);
          let decreaseMilliKg = BigInt(0);

          for (const adj of adjustments) {
            const quantity =
              quantityToMilliKg(
                adj._sum
                  .quantityKg
                  ?.toString() ??
                  "0",
              );

            switch (adj.type) {
              case EggStockAdjustmentType.OPENING:
                openingMilliKg += quantity;
                break;
              case EggStockAdjustmentType.INCREASE:
                increaseMilliKg += quantity;
                break;
              case EggStockAdjustmentType.DECREASE:
                decreaseMilliKg += quantity;
                break;
            }
          }

          const availableMilliKg =
            openingMilliKg +
            productionMilliKg -
            salesMilliKg +
            increaseMilliKg -
            decreaseMilliKg;

          const decrMilliKg =
            quantityToMilliKg(
              parsed.quantityKg,
            );

          if (
            decrMilliKg > availableMilliKg
          ) {
            const availableKg =
              availableMilliKg > BigInt(0)
                ? Number(availableMilliKg) / 1000
                : 0;
            throw ruleError(
              `Stok telur tidak mencukupi untuk koreksi pengurangan. Stok saat ini: ${availableKg} kg, pengurangan diminta: ${parsed.quantityKg} kg.`,
            );
          }
        }

        await tx.eggStockAdjustment.create({
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
        "Koreksi stok berhasil dicatat.",
    };
  } catch (error) {
    return handleError(
      error,
    );
  }
}