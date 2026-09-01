"use server";

import { revalidatePath } from "next/cache";

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import {
  assertFormulaComplete,
  FeedValidationError,
  parseFeedFormulaInput,
  parseFeedIngredientInput,
  percentageToBasisPoints,
} from "@/features/feed/schemas/feed";
import type {
  FeedActionResult,
  FeedFormulaInput,
  FeedIngredientInput,
} from "@/features/feed/types/feed";

const FEED_PATH = "/feed";

function ruleError(
  message: string,
): Error {
  return new Error(
    `FEED_RULE:${message}`,
  );
}

function getDatabaseErrorCode(
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

function handleActionError(
  error: unknown,
  duplicateMessage: string,
): FeedActionResult {
  if (
    error instanceof
    FeedValidationError
  ) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "FEED_RULE:",
    )
  ) {
    return {
      success: false,

      error: error.message.replace(
        "FEED_RULE:",
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
    getDatabaseErrorCode(error) ===
    "P2002"
  ) {
    return {
      success: false,
      error: duplicateMessage,
    };
  }

  console.error(error);

  return {
    success: false,

    error:
      "Terjadi kesalahan. Silakan coba lagi.",
  };
}

async function getPrimaryFarm() {
  const farm =
    await prisma.farm.findUnique({
      where: {
        scope: "PRIMARY",
      },

      select: {
        id: true,
      },
    });

  if (!farm) {
    throw ruleError(
      "Farm utama belum tersedia.",
    );
  }

  return farm;
}

async function validateIngredients(
  farmId: string,
  ingredientIds: string[],
  requireActive = false,
): Promise<void> {
  const ingredients =
    await prisma.feedIngredient.findMany({
      where: {
        farmId,
        id: {
          in: ingredientIds,
        },
      },
      select: {
        id: true,
        isActive: true,
      },
    });

  if (
    ingredients.length !== ingredientIds.length
  ) {
    throw ruleError(
      "Terdapat bahan pakan yang tidak valid.",
    );
  }

  if (
    requireActive &&
    ingredients.some((item) => !item.isActive)
  ) {
    throw ruleError(
      "Formula tidak dapat diaktifkan karena terdapat bahan pakan nonaktif.",
    );
  }
}

export async function createFeedIngredient(
  input: FeedIngredientInput,
): Promise<FeedActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseFeedIngredientInput(
        input,
      );

    const farm =
      await getPrimaryFarm();

    const existing =
      await prisma.feedIngredient.findFirst({
        where: {
          farmId: farm.id,
          name: {
            equals: parsed.name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      throw ruleError(
        "Nama bahan pakan sudah digunakan.",
      );
    }

    await prisma.feedIngredient.create({
      data: {
        farmId: farm.id,
        name: parsed.name,
        unit: "kg",

        currentPricePerKg:
          parsed.currentPricePerKg,

        isActive: true,
      },
    });

    revalidatePath(FEED_PATH);
    revalidatePath("/inventory");

    return {
      success: true,

      message:
        `Bahan pakan "${parsed.name}" berhasil ditambahkan.`,
    };
  } catch (error) {
    return handleActionError(
      error,
      "Nama bahan pakan sudah digunakan.",
    );
  }
}

export async function updateFeedIngredient(
  ingredientId: string,
  input: FeedIngredientInput,
): Promise<FeedActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseFeedIngredientInput(
        input,
      );

    const ingredient =
      await prisma.feedIngredient.findFirst({
        where: {
          id: ingredientId,

          farm: {
            scope: "PRIMARY",
          },
        },

        select: {
          id: true,
          farmId: true,
        },
      });

    if (!ingredient) {
      throw ruleError(
        "Bahan pakan tidak ditemukan.",
      );
    }

    const existing =
      await prisma.feedIngredient.findFirst({
        where: {
          farmId: ingredient.farmId,
          id: {
            not: ingredient.id,
          },
          name: {
            equals: parsed.name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      throw ruleError(
        "Nama bahan pakan sudah digunakan.",
      );
    }

    await prisma.feedIngredient.update({
      where: {
        id: ingredient.id,
      },

      data: {
        name: parsed.name,

        currentPricePerKg:
          parsed.currentPricePerKg,
      },
    });

    revalidatePath(FEED_PATH);
    revalidatePath("/inventory");

    return {
      success: true,

      message:
        `Bahan pakan "${parsed.name}" berhasil diperbarui.`,
    };
  } catch (error) {
    return handleActionError(
      error,
      "Nama bahan pakan sudah digunakan.",
    );
  }
}

export async function setFeedIngredientActive(
  ingredientId: string,
  isActive: boolean,
): Promise<FeedActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const ingredient =
      await prisma.feedIngredient.findFirst({
        where: {
          id: ingredientId,

          farm: {
            scope: "PRIMARY",
          },
        },

        select: {
          id: true,
          farmId: true,
        },
      });

    if (!ingredient) {
      throw ruleError(
        "Bahan pakan tidak ditemukan.",
      );
    }

    if (!isActive) {
      const activeFormulaUsage =
        await prisma.feedFormulaItem.count({
          where: {
            ingredientId:
              ingredient.id,

            formula: {
              farmId:
                ingredient.farmId,

              isActive: true,
            },
          },
        });

      if (
        activeFormulaUsage > 0
      ) {
        throw ruleError(
          "Bahan pakan tidak dapat dinonaktifkan karena masih digunakan oleh formula aktif.",
        );
      }
    }

    await prisma.feedIngredient.update({
      where: {
        id: ingredient.id,
      },

      data: {
        isActive,
      },
    });

    revalidatePath(FEED_PATH);

    return {
      success: true,

      message: isActive
        ? "Bahan pakan berhasil diaktifkan."
        : "Bahan pakan berhasil dinonaktifkan.",
    };
  } catch (error) {
    return handleActionError(
      error,
      "Gagal mengubah status bahan pakan.",
    );
  }
}

export async function createFeedFormula(
  input: FeedFormulaInput,
): Promise<FeedActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseFeedFormulaInput(
        input,
      );

    const farm =
      await getPrimaryFarm();

    const existing =
      await prisma.feedFormula.findFirst({
        where: {
          farmId: farm.id,
          name: {
            equals: parsed.name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      throw ruleError(
        "Nama formula sudah digunakan.",
      );
    }

    await validateIngredients(
      farm.id,

      parsed.items.map(
        (item) =>
          item.ingredientId,
      ),
    );

    await prisma.feedFormula.create({
      data: {
        farmId: farm.id,
        name: parsed.name,
        isActive: false,

        items: {
          create:
            parsed.items.map(
              (item) => ({
                ingredientId:
                  item.ingredientId,

                percentage:
                  item.percentage,
              }),
            ),
        },
      },
    });

    revalidatePath(FEED_PATH);

    return {
      success: true,

      message:
        "Formula pakan berhasil ditambahkan.",
    };
  } catch (error) {
    return handleActionError(
      error,
      "Nama formula sudah digunakan.",
    );
  }
}

export async function updateFeedFormula(
  formulaId: string,
  input: FeedFormulaInput,
): Promise<FeedActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseFeedFormulaInput(
        input,
      );

    const formula =
      await prisma.feedFormula.findFirst({
        where: {
          id: formulaId,

          farm: {
            scope: "PRIMARY",
          },
        },

        select: {
          id: true,
          farmId: true,
          isActive: true,
        },
      });

    if (!formula) {
      throw ruleError(
        "Formula pakan tidak ditemukan.",
      );
    }

    const existing =
      await prisma.feedFormula.findFirst({
        where: {
          farmId: formula.farmId,
          id: {
            not: formula.id,
          },
          name: {
            equals: parsed.name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      throw ruleError(
        "Nama formula sudah digunakan.",
      );
    }

    if (formula.isActive) {
      assertFormulaComplete(
        parsed.totalBasisPoints,
      );
    }

    await validateIngredients(
      formula.farmId,

      parsed.items.map(
        (item) =>
          item.ingredientId,
      ),

      formula.isActive,
    );

    await prisma.$transaction(
      async (tx) => {
        await tx.feedFormula.update({
          where: {
            id: formula.id,
          },

          data: {
            name: parsed.name,
          },
        });

        await tx.feedFormulaItem.deleteMany({
          where: {
            formulaId:
              formula.id,
          },
        });

        await tx.feedFormulaItem.createMany({
          data:
            parsed.items.map(
              (item) => ({
                formulaId:
                  formula.id,

                ingredientId:
                  item.ingredientId,

                percentage:
                  item.percentage,
              }),
            ),
        });
      },
    );

    revalidatePath(FEED_PATH);

    return {
      success: true,

      message:
        "Formula pakan berhasil diperbarui.",
    };
  } catch (error) {
    return handleActionError(
      error,
      "Nama formula sudah digunakan.",
    );
  }
}

export async function setFeedFormulaActive(
  formulaId: string,
  isActive: boolean,
): Promise<FeedActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    let successMessage = isActive
      ? "Formula pakan berhasil diaktifkan."
      : "Formula pakan berhasil dinonaktifkan.";

    await prisma.$transaction(
      async (tx) => {
        const formula =
          await tx.feedFormula.findFirst({
            where: {
              id: formulaId,

              farm: {
                scope: "PRIMARY",
              },
            },

            select: {
              id: true,
              farmId: true,
              name: true,

              items: {
                select: {
                  percentage: true,

                  ingredient: {
                    select: {
                      isActive: true,
                    },
                  },
                },
              },
            },
          });

        if (!formula) {
          throw ruleError(
            "Formula pakan tidak ditemukan.",
          );
        }

        if (!isActive) {
          await tx.feedFormula.update({
            where: {
              id: formula.id,
            },

            data: {
              isActive: false,
            },
          });

          successMessage = `Formula ${formula.name} berhasil dinonaktifkan.`;
          return;
        }

        if (
          formula.items.length === 0
        ) {
          throw ruleError(
            "Formula belum memiliki komposisi.",
          );
        }

        if (
          formula.items.some(
            (item) =>
              !item.ingredient
                .isActive,
          )
        ) {
          throw ruleError(
            "Formula tidak dapat diaktifkan karena terdapat bahan pakan nonaktif.",
          );
        }

        const totalBasisPoints =
          formula.items.reduce(
            (total, item) =>
              total +
              percentageToBasisPoints(
                item.percentage.toString(),
              ),
            0,
          );

        assertFormulaComplete(
          totalBasisPoints,
        );

        const previousActiveFormulas =
          await tx.feedFormula.findMany({
            where: {
              farmId: formula.farmId,
              isActive: true,
              id: {
                not: formula.id,
              },
            },
            select: {
              name: true,
            },
          });

        await tx.feedFormula.updateMany({
          where: {
            farmId: formula.farmId,

            isActive: true,

            id: {
              not: formula.id,
            },
          },

          data: {
            isActive: false,
          },
        });

        await tx.feedFormula.update({
          where: {
            id: formula.id,
          },

          data: {
            isActive: true,
          },
        });

        if (previousActiveFormulas.length > 0) {
          const prevNames = previousActiveFormulas
            .map((f) => f.name)
            .join(", ");
          successMessage = `Formula ${prevNames} dinonaktifkan, Formula ${formula.name} sekarang aktif.`;
        } else {
          successMessage = `Formula ${formula.name} sekarang aktif.`;
        }
      },
    );

    revalidatePath(FEED_PATH);

    return {
      success: true,
      message: successMessage,
    };
  } catch (error) {
    return handleActionError(
      error,
      "Gagal mengubah status formula.",
    );
  }
}