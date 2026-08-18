"use server";

import { revalidatePath } from "next/cache";

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

import {
  parseCustomerInput,
  parseEggPriceInput,
  SalesValidationError,
} from "@/features/sales/schemas/sales";
import type {
  CustomerInput,
  EggPriceInput,
  SalesActionResult,
} from "@/features/sales/types/sales";

const SALES_PATH = "/sales";

function ruleError(
  message: string,
): Error {
  return new Error(
    `SALES_RULE:${message}`,
  );
}

function handleActionError(
  error: unknown,
): SalesActionResult {
  if (
    error instanceof
    SalesValidationError
  ) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "SALES_RULE:",
    )
  ) {
    return {
      success: false,

      error: error.message.replace(
        "SALES_RULE:",
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

export async function createCustomer(
  input: CustomerInput,
): Promise<SalesActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseCustomerInput(input);

    const farm =
      await getPrimaryFarm();

    await prisma.customer.create({
      data: {
        farmId: farm.id,

        name: parsed.name,
        phone: parsed.phone,
        address:
          parsed.address,

        discountPerKg:
          parsed.discountPerKg,

        isActive: true,
      },
    });

    revalidatePath(
      SALES_PATH,
    );

    return {
      success: true,

      message:
        "Customer berhasil ditambahkan.",
    };
  } catch (error) {
    return handleActionError(
      error,
    );
  }
}

export async function updateCustomer(
  customerId: string,
  input: CustomerInput,
): Promise<SalesActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseCustomerInput(input);

    const customer =
      await prisma.customer.findFirst({
        where: {
          id: customerId,

          farm: {
            scope: "PRIMARY",
          },
        },

        select: {
          id: true,
        },
      });

    if (!customer) {
      throw ruleError(
        "Customer tidak ditemukan.",
      );
    }

    await prisma.customer.update({
      where: {
        id: customer.id,
      },

      data: {
        name: parsed.name,
        phone: parsed.phone,
        address:
          parsed.address,

        discountPerKg:
          parsed.discountPerKg,
      },
    });

    revalidatePath(
      SALES_PATH,
    );

    return {
      success: true,

      message:
        "Customer berhasil diperbarui.",
    };
  } catch (error) {
    return handleActionError(
      error,
    );
  }
}

export async function setCustomerActive(
  customerId: string,
  isActive: boolean,
): Promise<SalesActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const customer =
      await prisma.customer.findFirst({
        where: {
          id: customerId,

          farm: {
            scope: "PRIMARY",
          },
        },

        select: {
          id: true,
        },
      });

    if (!customer) {
      throw ruleError(
        "Customer tidak ditemukan.",
      );
    }

    await prisma.customer.update({
      where: {
        id: customer.id,
      },

      data: {
        isActive,
      },
    });

    revalidatePath(
      SALES_PATH,
    );

    return {
      success: true,

      message: isActive
        ? "Customer berhasil diaktifkan."
        : "Customer berhasil dinonaktifkan.",
    };
  } catch (error) {
    return handleActionError(
      error,
    );
  }
}

export async function createEggPrice(
  input: EggPriceInput,
): Promise<SalesActionResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseEggPriceInput(
        input,
      );

    const farm =
      await getPrimaryFarm();

    await prisma.eggPrice.create({
      data: {
        farmId: farm.id,

        pricePerKg:
          parsed.pricePerKg,

        effectiveAt:
          parsed.effectiveAt,
      },
    });

    revalidatePath(
      SALES_PATH,
    );

    return {
      success: true,

      message:
        "Harga telur baru berhasil disimpan.",
    };
  } catch (error) {
    return handleActionError(
      error,
    );
  }
}