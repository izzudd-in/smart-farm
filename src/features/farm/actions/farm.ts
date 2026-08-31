"use server";

import { revalidatePath } from "next/cache";

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import {
  FarmValidationError,
  parseFlockInput,
  parseKandangInput,
} from "@/features/farm/schemas/farm";
import type {
  FarmActionResult,
  FlockInput,
  KandangInput,
} from "@/features/farm/types/farm";
import { getJakartaDateString } from "@/features/farm/utils/flock-age";

const FARM_PATH = "/farm";

function ruleError(message: string): Error {
  return new Error(`FARM_RULE:${message}`);
}

function getDatabaseErrorInfo(
  error: unknown,
): { code?: string; target?: string[] } | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    let target: string[] | undefined;
    if (
      "meta" in error &&
      typeof error.meta === "object" &&
      error.meta !== null &&
      "target" in error.meta &&
      Array.isArray(error.meta.target)
    ) {
      target = error.meta.target as string[];
    }
    return { code: error.code, target };
  }

  return null;
}

function actionError(
  error: unknown,
  duplicateMessage: string,
): FarmActionResult {
  if (
    error instanceof FarmValidationError
  ) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "FARM_RULE:",
    )
  ) {
    return {
      success: false,
      error: error.message.replace(
        "FARM_RULE:",
        "",
      ),
    };
  }

  if (
    error instanceof Error &&
    ["UNAUTHENTICATED", "FORBIDDEN"].includes(
      error.message,
    )
  ) {
    return {
      success: false,
      error: "Akses ditolak.",
    };
  }

  const dbInfo = getDatabaseErrorInfo(error);
  if (dbInfo?.code === "P2002") {
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
  const farm = await prisma.farm.findUnique({
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

async function validateOperators(
  operatorIds: string[],
): Promise<void> {
  if (operatorIds.length === 0) {
    return;
  }

  const count = await prisma.user.count({
    where: {
      id: {
        in: operatorIds,
      },
      role: UserRole.OPERATOR,
      isActive: true,
    },
  });

  if (count !== operatorIds.length) {
    throw ruleError(
      "Terdapat operator yang tidak valid atau sudah nonaktif.",
    );
  }
}

export async function createKandang(
  input: KandangInput,
): Promise<FarmActionResult> {
  try {
    await requireRole(UserRole.OWNER);

    const data = parseKandangInput(input);
    const farm = await getPrimaryFarm();

    await validateOperators(
      data.operatorIds,
    );

    await prisma.kandang.create({
      data: {
        farmId: farm.id,
        code: data.code,
        name: data.name,
        isActive: true,
        operators: {
          connect: data.operatorIds.map(
            (id) => ({
              id,
            }),
          ),
        },
      },
    });

    revalidatePath(FARM_PATH);

    return {
      success: true,
      message: "Kandang berhasil ditambahkan.",
    };
  } catch (error) {
    return actionError(
      error,
      "Nama atau kode kandang sudah digunakan.",
    );
  }
}

export async function updateKandang(
  kandangId: string,
  input: KandangInput,
): Promise<FarmActionResult> {
  try {
    await requireRole(UserRole.OWNER);

    const data = parseKandangInput(input);

    await validateOperators(
      data.operatorIds,
    );

    const kandang =
      await prisma.kandang.findFirst({
        where: {
          id: kandangId,
          farm: {
            scope: "PRIMARY",
          },
        },
        select: {
          id: true,
        },
      });

    if (!kandang) {
      throw ruleError(
        "Kandang tidak ditemukan.",
      );
    }

    await prisma.kandang.update({
      where: {
        id: kandang.id,
      },
      data: {
        code: data.code,
        name: data.name,
        operators: {
          set: data.operatorIds.map(
            (id) => ({
              id,
            }),
          ),
        },
      },
    });

    revalidatePath(FARM_PATH);

    return {
      success: true,
      message: "Kandang berhasil diperbarui.",
    };
  } catch (error) {
    return actionError(
      error,
      "Nama atau kode kandang sudah digunakan.",
    );
  }
}

export async function setKandangActive(
  kandangId: string,
  isActive: boolean,
): Promise<FarmActionResult> {
  try {
    await requireRole(UserRole.OWNER);

    await prisma.$transaction(
      async (tx) => {
        const kandang =
          await tx.kandang.findFirst({
            where: {
              id: kandangId,
              farm: {
                scope: "PRIMARY",
              },
            },
            select: {
              id: true,
              activeFlockId: true,
            },
          });

        if (!kandang) {
          throw ruleError(
            "Kandang tidak ditemukan.",
          );
        }

        if (
          !isActive &&
          kandang.activeFlockId
        ) {
          const today = new Date(
            `${getJakartaDateString()}T00:00:00.000Z`,
          );

          await tx.flock.update({
            where: {
              id: kandang.activeFlockId,
            },
            data: {
              endedAt: today,
            },
          });
        }

        await tx.kandang.update({
          where: {
            id: kandang.id,
          },
          data: isActive
            ? {
                isActive: true,
              }
            : {
                isActive: false,
                activeFlock: {
                  disconnect: true,
                },
              },
        });
      },
    );

    revalidatePath(FARM_PATH);

    return {
      success: true,
      message: isActive
        ? "Kandang berhasil diaktifkan."
        : "Kandang berhasil dinonaktifkan.",
    };
  } catch (error) {
    return actionError(
      error,
      "Gagal mengubah status kandang.",
    );
  }
}

export async function startFlock(
  kandangId: string,
  input: FlockInput,
): Promise<FarmActionResult> {
  try {
    await requireRole(UserRole.OWNER);

    const data = parseFlockInput(input);

    await prisma.$transaction(
      async (tx) => {
        const kandang =
          await tx.kandang.findFirst({
            where: {
              id: kandangId,
              farm: {
                scope: "PRIMARY",
              },
            },
            select: {
              id: true,
              isActive: true,
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
            "Kandang tidak ditemukan.",
          );
        }

        if (!kandang.isActive) {
          throw ruleError(
            "Aktifkan kandang sebelum memulai flock.",
          );
        }

        if (
          kandang.activeFlock &&
          data.startDate.getTime() <
            kandang.activeFlock.startDate.getTime()
        ) {
          throw ruleError(
            "Tanggal flock baru tidak boleh lebih awal dari flock aktif.",
          );
        }

        const newFlock =
          await tx.flock.create({
            data: {
              kandangId: kandang.id,
              name: data.name,
              startDate: data.startDate,
              initialPopulation:
                data.initialPopulation,
            },
          });

        if (kandang.activeFlock) {
          await tx.flock.update({
            where: {
              id: kandang.activeFlock.id,
            },
            data: {
              endedAt: data.startDate,
            },
          });
        }

        await tx.kandang.update({
          where: {
            id: kandang.id,
          },
          data: {
            activeFlock: {
              connect: {
                id: newFlock.id,
              },
            },
          },
        });
      },
    );

    revalidatePath(FARM_PATH);

    return {
      success: true,
      message: "Flock baru berhasil dimulai.",
    };
  } catch (error) {
    return actionError(
      error,
      "Nama flock tersebut sudah digunakan pada kandang ini.",
    );
  }
}

export async function updateFlock(
  flockId: string,
  input: FlockInput,
): Promise<FarmActionResult> {
  try {
    await requireRole(UserRole.OWNER);

    const data = parseFlockInput(input);

    const flock =
      await prisma.flock.findFirst({
        where: {
          id: flockId,
          kandang: {
            farm: {
              scope: "PRIMARY",
            },
          },
        },
        select: {
          id: true,
          endedAt: true,
        },
      });

    if (!flock) {
      throw ruleError(
        "Flock tidak ditemukan.",
      );
    }

    if (
      flock.endedAt &&
      data.startDate.getTime() > flock.endedAt.getTime()
    ) {
      throw ruleError(
        "Tanggal mulai tidak boleh melewati tanggal berakhir flock.",
      );
    }

    await prisma.flock.update({
      where: {
        id: flock.id,
      },
      data: {
        name: data.name,
        startDate: data.startDate,
        initialPopulation:
          data.initialPopulation,
      },
    });

    revalidatePath(FARM_PATH);

    return {
      success: true,
      message: "Data flock berhasil diperbarui.",
    };
  } catch (error) {
    return actionError(
      error,
      "Nama flock tersebut sudah digunakan pada kandang ini.",
    );
  }
}