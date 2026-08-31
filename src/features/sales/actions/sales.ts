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
  parseCustomerInput,
  parseEggPriceInput,
  parseOrderInput,
  parseOrderPricingPreviewInput,
  SalesValidationError,
} from "@/features/sales/schemas/sales";

import type {
  CreateOrderResult,
  CustomerInput,
  EggPriceInput,
  OrderInput,
  OrderPricingPreviewInput,
  OrderPricingPreviewResult,
  SalesActionResult,
} from "@/features/sales/types/sales";

import {
  calculateFinalPricePerKg,
  calculateOrderTotal,
} from "@/features/sales/utils/pricing";

import {
  getEggPriceForDate,
} from "@/features/sales/queries/get-egg-price-for-date";

import {
  getEggStockAsOfDate,
} from "@/features/inventory/queries/get-egg-stock";

const SALES_PATH =
  "/sales";

const DASHBOARD_PATH =
  "/dashboard";

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
      success:
        false,

      error:
        error.message,
    };
  }

  if (
    error instanceof Error &&
    error.message.startsWith(
      "SALES_RULE:",
    )
  ) {
    return {
      success:
        false,

      error:
        error.message.replace(
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
      "Terjadi kesalahan. Silakan coba lagi.",
  };
}

function handleOrderError(
  error: unknown,
): CreateOrderResult {
  const result =
    handleActionError(
      error,
    );

  if (
    !result.success
  ) {
    return result;
  }

  return {
    success:
      false,

    error:
      "Terjadi kesalahan saat membuat order.",
  };
}

async function getPrimaryFarm() {
  const farm =
    await prisma.farm.findUnique({
      where: {
        scope:
          "PRIMARY",
      },

      select: {
        id:
          true,
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
      parseCustomerInput(
        input,
      );

    const farm =
      await getPrimaryFarm();

    const existingCustomer =
      await prisma.customer.findFirst({
        where: {
          farmId:
            farm.id,
          name: {
            equals:
              parsed.name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existingCustomer) {
      throw ruleError(
        "Customer dengan nama tersebut sudah terdaftar.",
      );
    }

    await prisma.customer.create({
      data: {
        farmId:
          farm.id,

        name:
          parsed.name,

        phone:
          parsed.phone,

        address:
          parsed.address,

        discountPerKg:
          parsed.discountPerKg,

        isActive:
          true,
      },
    });

    revalidatePath(
      SALES_PATH,
    );

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

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
      parseCustomerInput(
        input,
      );

    const customer =
      await prisma.customer.findFirst({
        where: {
          id:
            customerId,

          farm: {
            scope:
              "PRIMARY",
          },
        },

        select: {
          id:
            true,
          farmId:
            true,
        },
      });

    if (!customer) {
      throw ruleError(
        "Customer tidak ditemukan.",
      );
    }

    const existingCustomer =
      await prisma.customer.findFirst({
        where: {
          farmId:
            customer.farmId,
          id: {
            not: customer.id,
          },
          name: {
            equals:
              parsed.name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existingCustomer) {
      throw ruleError(
        "Customer dengan nama tersebut sudah terdaftar.",
      );
    }

    await prisma.customer.update({
      where: {
        id:
          customer.id,
      },

      data: {
        name:
          parsed.name,

        phone:
          parsed.phone,

        address:
          parsed.address,

        discountPerKg:
          parsed.discountPerKg,
      },
    });

    revalidatePath(
      SALES_PATH,
    );

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

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
          id:
            customerId,

          farm: {
            scope:
              "PRIMARY",
          },
        },

        select: {
          id:
            true,
        },
      });

    if (!customer) {
      throw ruleError(
        "Customer tidak ditemukan.",
      );
    }

    await prisma.customer.update({
      where: {
        id:
          customer.id,
      },

      data: {
        isActive,
      },
    });

    revalidatePath(
      SALES_PATH,
    );

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

      message:
        isActive
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
        farmId:
          farm.id,

        pricePerKg:
          parsed.pricePerKg,

        effectiveAt:
          parsed.effectiveAt,
      },
    });

    revalidatePath(
      SALES_PATH,
    );

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

      message:
        "Harga telur baru berhasil disimpan.",
    };
  } catch (error) {
    return handleActionError(
      error,
    );
  }
}

export async function getOrderPricingPreview(
  input: OrderPricingPreviewInput,
): Promise<OrderPricingPreviewResult> {
  try {
    await requireRole(
      UserRole.OWNER,
    );

    const parsed =
      parseOrderPricingPreviewInput(
        input,
      );

    const customer =
      await prisma.customer.findFirst({
        where: {
          id:
            parsed.customerId,

          isActive:
            true,

          farm: {
            scope:
              "PRIMARY",
          },
        },

        select: {
          name:
            true,

          discountPerKg:
            true,
        },
      });

    if (!customer) {
      return {
        success:
          false,

        error:
          "Customer tidak tersedia atau sudah nonaktif.",
      };
    }

    const [eggPrice, stockSummary] =
      await Promise.all([
        getEggPriceForDate(
          parsed.orderedAt,
        ),
        getEggStockAsOfDate(
          parsed.orderedAt,
        ),
      ]);

    if (!eggPrice) {
      return {
        success:
          false,

        error:
          "Belum ada harga telur yang berlaku pada tanggal tersebut.",
      };
    }

    const basePricePerKg =
      eggPrice.pricePerKg.toString();

    const discountPerKg =
      customer.discountPerKg.toString();

    if (Number(discountPerKg) > Number(basePricePerKg)) {
      return {
        success:
          false,

        error:
          "Diskon customer tidak boleh melebihi harga dasar telur.",
      };
    }

    return {
      success:
        true,

      customerName:
        customer.name,

      basePricePerKg,

      discountPerKg,

      finalPricePerKg:
        calculateFinalPricePerKg(
          basePricePerKg,
          discountPerKg,
        ),

      availableStockKg:
        stockSummary.currentStockKg,
    };
  } catch (error) {
    if (
      error instanceof
      SalesValidationError
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
        "Gagal mengambil preview harga.",
    };
  }
}

export async function createOrder(
  input: OrderInput,
): Promise<CreateOrderResult> {
  try {
    const sessionUser =
      await requireRole(
        UserRole.OWNER,
      );

    const parsed =
      parseOrderInput(
        input,
      );

    const order =
      await prisma.$transaction(
        async (
          tx,
        ) => {
          const owner =
            await tx.user.findFirst({
              where: {
                id:
                  sessionUser.id,

                role:
                  UserRole.OWNER,

                isActive:
                  true,
              },

              select: {
                id:
                  true,
              },
            });

          if (!owner) {
            throw ruleError(
              "Sesi Owner tidak valid.",
            );
          }

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

          const customer =
            await tx.customer.findFirst({
              where: {
                id:
                  parsed.customerId,

                farmId:
                  farm.id,

                isActive:
                  true,
              },

              select: {
                id:
                  true,

                name:
                  true,

                discountPerKg:
                  true,
              },
            });

          if (!customer) {
            throw ruleError(
              "Customer tidak tersedia atau sudah nonaktif.",
            );
          }

          const eggPrice =
            await tx.eggPrice.findFirst({
              where: {
                farmId:
                  farm.id,

                effectiveAt: {
                  lte:
                    parsed.orderedAt,
                },
              },

              orderBy: [
                {
                  effectiveAt:
                    "desc",
                },

                {
                  createdAt:
                    "desc",
                },
              ],

              select: {
                pricePerKg:
                  true,
              },
            });

          if (!eggPrice) {
            throw ruleError(
              "Belum ada harga telur yang berlaku pada tanggal tersebut.",
            );
          }

          const basePricePerKg =
            eggPrice.pricePerKg.toString();

          const discountPerKg =
            customer.discountPerKg.toString();

          if (Number(discountPerKg) >= Number(basePricePerKg)) {
            throw ruleError(
              "Diskon customer tidak boleh melebihi atau sama dengan harga dasar telur.",
            );
          }

          const finalPricePerKg =
            calculateFinalPricePerKg(
              basePricePerKg,
              discountPerKg,
            );

          if (Number(finalPricePerKg) <= 0) {
            throw ruleError(
              "Harga akhir per kg harus lebih dari 0.",
            );
          }

          // Validasi stok telur mencukupi sebelum membuat order (REL-009 / FT-052)
          const [productionAgg, salesAgg, adjustmentsAgg] = await Promise.all([
            tx.dailyReport.aggregate({
              where: {
                date: { lte: parsed.orderedAt },
                kandang: { farmId: farm.id },
                saleableEgg: { not: null },
                damagedEgg: { not: null },
                feedUsed: { not: null },
                mortality: { not: null },
              },
              _sum: { saleableEgg: true },
            }),
            tx.order.aggregate({
              where: {
                orderedAt: { lte: parsed.orderedAt },
                farmId: farm.id,
              },
              _sum: { quantityKg: true },
            }),
            tx.eggStockAdjustment.groupBy({
              by: ["type"],
              where: {
                occurredAt: { lte: parsed.orderedAt },
                farmId: farm.id,
              },
              _sum: { quantityKg: true },
            }),
          ]);

          const prodMilliKg = BigInt(Math.round((productionAgg._sum.saleableEgg ?? 0) * 1000));
          const soldMilliKg = BigInt(Math.round(Number(salesAgg._sum.quantityKg ?? 0) * 1000));

          let adjMilliKg = BigInt(0);
          for (const adj of adjustmentsAgg) {
            const qtyMilliKg = BigInt(Math.round(Number(adj._sum.quantityKg ?? 0) * 1000));
            if (adj.type === "OPENING" || adj.type === "INCREASE") {
              adjMilliKg += qtyMilliKg;
            } else if (adj.type === "DECREASE") {
              adjMilliKg -= qtyMilliKg;
            }
          }

          const availableStockMilliKg = prodMilliKg + adjMilliKg - soldMilliKg;
          const orderQtyMilliKg = BigInt(Math.round(Number(parsed.quantityKg) * 1000));

          if (orderQtyMilliKg > availableStockMilliKg) {
            const availableKg = Number(availableStockMilliKg > BigInt(0) ? availableStockMilliKg : BigInt(0)) / 1000;
            throw ruleError(
              `Stok telur tidak mencukupi. Stok tersedia: ${availableKg} kg, jumlah order: ${parsed.quantityKg} kg.`,
            );
          }

          const totalPrice =
            calculateOrderTotal(
              parsed.quantityKg,
              finalPricePerKg,
            );

          return tx.order.create({
            data: {
              farmId:
                farm.id,

              customerId:
                customer.id,

              customerNameSnapshot:
                customer.name,

              orderedAt:
                parsed.orderedAt,

              quantityKg:
                parsed.quantityKg,

              basePricePerKg,

              discountPerKg,

              finalPricePerKg,

              totalPrice,

              note:
                parsed.note,
            },

            select: {
              id:
                true,
            },
          });
        },
      );

    revalidatePath(
      SALES_PATH,
    );

    revalidatePath(
      DASHBOARD_PATH,
    );

    return {
      success:
        true,

      message:
        "Order berhasil dibuat.",

      orderId:
        order.id,
    };
  } catch (error) {
    return handleOrderError(
      error,
    );
  }
}