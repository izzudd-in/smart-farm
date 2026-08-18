import "dotenv/config";

import {
  PrismaPg,
} from "@prisma/adapter-pg";

import {
  PrismaClient,
} from "../src/generated/prisma/client";

import {
  DailyExpenseCategory,
  EggStockAdjustmentType,
  FeedStockAdjustmentType,
  RoutineCostCategory,
  UserRole,
} from "../src/generated/prisma/enums";

import {
  hashPassword,
} from "../src/lib/auth/password";

import {
  calculateFinalPricePerKg,
  calculateOrderTotal,
} from "../src/features/sales/utils/pricing";

import {
  calculateFeedPurchaseTotal,
} from "../src/features/inventory/utils/feed-stock";

const databaseUrl =
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not configured.",
  );
}

const adapter =
  new PrismaPg({
    connectionString:
      databaseUrl,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

const developmentUsers = [
  {
    name:
      "Owner Development",
    email:
      "owner@smartfarm.local",
    password:
      "owner123",
    role:
      UserRole.OWNER,
  },
  {
    name:
      "Operator Development",
    email:
      "operator@smartfarm.local",
    password:
      "operator123",
    role:
      UserRole.OPERATOR,
  },
];

async function ensureCustomer(
  farmId: string,
  data: {
    name: string;
    phone: string | null;
    address: string | null;
    discountPerKg: string;
  },
) {
  const existing =
    await prisma.customer.findFirst({
      where: {
        farmId,
        name:
          data.name,
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    return prisma.customer.update({
      where: {
        id:
          existing.id,
      },

      data: {
        phone:
          data.phone,

        address:
          data.address,

        discountPerKg:
          data.discountPerKg,

        isActive:
          true,
      },
    });
  }

  return prisma.customer.create({
    data: {
      farmId,

      name:
        data.name,

      phone:
        data.phone,

      address:
        data.address,

      discountPerKg:
        data.discountPerKg,

      isActive:
        true,
    },
  });
}

async function ensureEggPrice(
  farmId: string,
  effectiveAt: Date,
  pricePerKg: string,
) {
  const existing =
    await prisma.eggPrice.findFirst({
      where: {
        farmId,
        effectiveAt,
        pricePerKg,
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.eggPrice.create({
    data: {
      farmId,
      effectiveAt,
      pricePerKg,
    },

    select: {
      id: true,
    },
  });
}

async function ensureOrder(
  data: {
    id: string;
    farmId: string;
    customerId: string;
    customerNameSnapshot: string;
    orderedAt: Date;
    quantityKg: string;
    basePricePerKg: string;
    discountPerKg: string;
    finalPricePerKg: string;
    totalPrice: string;
    note: string;
  },
) {
  const existing =
    await prisma.order.findUnique({
      where: {
        id:
          data.id,
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.order.create({
    data,

    select: {
      id: true,
    },
  });
}

async function ensureFeedPurchase(
  data: {
    id: string;
    farmId: string;
    ingredientId: string;
    purchasedAt: Date;
    quantityKg: string;
    unitPricePerKg: string;
    supplier: string;
    note: string;
    createdById: string;
  },
) {
  const existing =
    await prisma.feedPurchase.findUnique({
      where: {
        id:
          data.id,
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.feedPurchase.create({
    data: {
      ...data,

      totalPrice:
        calculateFeedPurchaseTotal(
          data.quantityKg,
          data.unitPricePerKg,
        ),
    },

    select: {
      id: true,
    },
  });
}

async function ensureFeedOpening(
  data: {
    id: string;
    farmId: string;
    ingredientId: string;
    occurredAt: Date;
    quantityKg: string;
    note: string;
    createdById: string;
  },
) {
  const existing =
    await prisma.feedStockAdjustment.findUnique({
      where: {
        openingKey:
          data.ingredientId,
      },

      select: {
        id: true,
      },
    });

  if (existing) {
    return existing;
  }

  return prisma.feedStockAdjustment.create({
    data: {
      ...data,

      type:
        FeedStockAdjustmentType.OPENING,

      openingKey:
        data.ingredientId,
    },

    select: {
      id: true,
    },
  });
}

async function ensureRoutineCost(
  data: {
    id: string;
    farmId: string;
    category: RoutineCostCategory;
    name: string;
    amount: string;
    periodStart: Date;
    periodEnd: Date;
    note: string;
    createdById: string;
  },
) {
  return prisma.routineCost.upsert({
    where: {
      id:
        data.id,
    },

    update: {
      farmId:
        data.farmId,

      category:
        data.category,

      name:
        data.name,

      amount:
        data.amount,

      periodStart:
        data.periodStart,

      periodEnd:
        data.periodEnd,

      note:
        data.note,
    },

    create:
      data,
  });
}

async function ensureDailyExpense(
  data: {
    id: string;
    farmId: string;
    category: DailyExpenseCategory;
    amount: string;
    occurredAt: Date;
    description: string;
    createdById: string;
  },
) {
  return prisma.dailyExpense.upsert({
    where: {
      id: data.id,
    },

    update: {
      farmId: data.farmId,
      category: data.category,
      amount: data.amount,
      occurredAt: data.occurredAt,
      description: data.description,
    },

    create: data,
  });
}

async function main() {
  await prisma.systemState.upsert({
    where: {
      key:
        "foundation",
    },

    update: {
      value:
        "ready",
    },

    create: {
      key:
        "foundation",

      value:
        "ready",
    },
  });

  for (
    const developmentUser
    of developmentUsers
  ) {
    const passwordHash =
      await hashPassword(
        developmentUser.password,
      );

    await prisma.user.upsert({
      where: {
        email:
          developmentUser.email,
      },

      update: {
        name:
          developmentUser.name,

        passwordHash,

        role:
          developmentUser.role,

        isActive:
          true,
      },

      create: {
        name:
          developmentUser.name,

        email:
          developmentUser.email,

        passwordHash,

        role:
          developmentUser.role,

        isActive:
          true,
      },
    });
  }

  const owner =
    await prisma.user.findUniqueOrThrow({
      where: {
        email:
          "owner@smartfarm.local",
      },
    });

  const operator =
    await prisma.user.findUniqueOrThrow({
      where: {
        email:
          "operator@smartfarm.local",
      },
    });

  const farm =
    await prisma.farm.upsert({
      where: {
        scope:
          "PRIMARY",
      },

      update: {
        code:
          "UDINFARM",

        name:
          "UdinFarm",

        isActive:
          true,
      },

      create: {
        scope:
          "PRIMARY",

        code:
          "UDINFARM",

        name:
          "UdinFarm",

        isActive:
          true,
      },
    });

  const kandangA =
    await prisma.kandang.upsert({
      where: {
        farmId_code: {
          farmId:
            farm.id,
          code:
            "A",
        },
      },

      update: {
        name:
          "Kandang A",

        isActive:
          true,

        operators: {
          set: [
            {
              id:
                operator.id,
            },
          ],
        },
      },

      create: {
        farmId:
          farm.id,

        code:
          "A",

        name:
          "Kandang A",

        isActive:
          true,

        operators: {
          connect: {
            id:
              operator.id,
          },
        },
      },
    });

  const kandangB =
    await prisma.kandang.upsert({
      where: {
        farmId_code: {
          farmId:
            farm.id,
          code:
            "B",
        },
      },

      update: {
        name:
          "Kandang B",

        isActive:
          true,

        operators: {
          set: [
            {
              id:
                operator.id,
            },
          ],
        },
      },

      create: {
        farmId:
          farm.id,

        code:
          "B",

        name:
          "Kandang B",

        isActive:
          true,

        operators: {
          connect: {
            id:
              operator.id,
          },
        },
      },
    });

  const flockA =
    await prisma.flock.upsert({
      where: {
        kandangId_name: {
          kandangId:
            kandangA.id,

          name:
            "Flock A 2026",
        },
      },

      update: {
        startDate:
          new Date(
            "2026-02-01T00:00:00.000Z",
          ),

        initialPopulation:
          5000,

        endedAt:
          null,
      },

      create: {
        kandangId:
          kandangA.id,

        name:
          "Flock A 2026",

        startDate:
          new Date(
            "2026-02-01T00:00:00.000Z",
          ),

        initialPopulation:
          5000,
      },
    });

  const flockB =
    await prisma.flock.upsert({
      where: {
        kandangId_name: {
          kandangId:
            kandangB.id,

          name:
            "Flock B 2026",
        },
      },

      update: {
        startDate:
          new Date(
            "2026-03-15T00:00:00.000Z",
          ),

        initialPopulation:
          4500,

        endedAt:
          null,
      },

      create: {
        kandangId:
          kandangB.id,

        name:
          "Flock B 2026",

        startDate:
          new Date(
            "2026-03-15T00:00:00.000Z",
          ),

        initialPopulation:
          4500,
      },
    });

  await prisma.kandang.update({
    where: {
      id:
        kandangA.id,
    },

    data: {
      activeFlock: {
        connect: {
          id:
            flockA.id,
        },
      },
    },
  });

  await prisma.kandang.update({
    where: {
      id:
        kandangB.id,
    },

    data: {
      activeFlock: {
        connect: {
          id:
            flockB.id,
        },
      },
    },
  });

  const jagung =
    await prisma.feedIngredient.upsert({
      where: {
        farmId_name: {
          farmId:
            farm.id,

          name:
            "Jagung",
        },
      },

      update: {
        unit:
          "kg",

        currentPricePerKg:
          "5500.00",

        isActive:
          true,
      },

      create: {
        farmId:
          farm.id,

        name:
          "Jagung",

        unit:
          "kg",

        currentPricePerKg:
          "5500.00",

        isActive:
          true,
      },
    });

  const konsentrat =
    await prisma.feedIngredient.upsert({
      where: {
        farmId_name: {
          farmId:
            farm.id,

          name:
            "Konsentrat",
        },
      },

      update: {
        unit:
          "kg",

        currentPricePerKg:
          "8500.00",

        isActive:
          true,
      },

      create: {
        farmId:
          farm.id,

        name:
          "Konsentrat",

        unit:
          "kg",

        currentPricePerKg:
          "8500.00",

        isActive:
          true,
      },
    });

  const dedak =
    await prisma.feedIngredient.upsert({
      where: {
        farmId_name: {
          farmId:
            farm.id,

          name:
            "Dedak",
        },
      },

      update: {
        unit:
          "kg",

        currentPricePerKg:
          "3500.00",

        isActive:
          true,
      },

      create: {
        farmId:
          farm.id,

        name:
          "Dedak",

        unit:
          "kg",

        currentPricePerKg:
          "3500.00",

        isActive:
          true,
      },
    });

  const formula =
    await prisma.feedFormula.upsert({
      where: {
        farmId_name: {
          farmId:
            farm.id,

          name:
            "Formula Layer Utama",
        },
      },

      update: {
        isActive:
          false,
      },

      create: {
        farmId:
          farm.id,

        name:
          "Formula Layer Utama",

        isActive:
          false,
      },
    });

  await prisma.$transaction([
    prisma.feedFormula.updateMany({
      where: {
        farmId:
          farm.id,

        id: {
          not:
            formula.id,
        },
      },

      data: {
        isActive:
          false,
      },
    }),

    prisma.feedFormulaItem.deleteMany({
      where: {
        formulaId:
          formula.id,
      },
    }),

    prisma.feedFormulaItem.createMany({
      data: [
        {
          formulaId:
            formula.id,

          ingredientId:
            jagung.id,

          percentage:
            "50.00",
        },
        {
          formulaId:
            formula.id,

          ingredientId:
            konsentrat.id,

          percentage:
            "35.00",
        },
        {
          formulaId:
            formula.id,

          ingredientId:
            dedak.id,

          percentage:
            "15.00",
        },
      ],
    }),

    prisma.feedFormula.update({
      where: {
        id:
          formula.id,
      },

      data: {
        isActive:
          true,
      },
    }),
  ]);

  const tokoBerkah =
    await ensureCustomer(
      farm.id,
      {
        name:
          "Toko Berkah",

        phone:
          "081234567890",

        address:
          "Jember",

        discountPerKg:
          "500.00",
      },
    );

  const warungMaju =
    await ensureCustomer(
      farm.id,
      {
        name:
          "Warung Maju",

        phone:
          "081298765432",

        address:
          "Jember",

        discountPerKg:
          "0.00",
      },
    );

  await ensureEggPrice(
    farm.id,
    new Date(
      "2026-08-10T00:00:00.000Z",
    ),
    "27500.00",
  );

  await ensureEggPrice(
    farm.id,
    new Date(
      "2026-08-18T00:00:00.000Z",
    ),
    "28000.00",
  );

  const historicalFinalPrice =
    calculateFinalPricePerKg(
      "27500.00",
      tokoBerkah.discountPerKg.toString(),
    );

  await ensureOrder({
    id:
      "seed-order-toko-20260815",

    farmId:
      farm.id,

    customerId:
      tokoBerkah.id,

    customerNameSnapshot:
      tokoBerkah.name,

    orderedAt:
      new Date(
        "2026-08-15T00:00:00.000Z",
      ),

    quantityKg:
      "100",

    basePricePerKg:
      "27500.00",

    discountPerKg:
      tokoBerkah.discountPerKg.toString(),

    finalPricePerKg:
      historicalFinalPrice,

    totalPrice:
      calculateOrderTotal(
        "100",
        historicalFinalPrice,
      ),

    note:
      "Seed order harga historis.",
  });

  const currentDiscountFinalPrice =
    calculateFinalPricePerKg(
      "28000.00",
      tokoBerkah.discountPerKg.toString(),
    );

  await ensureOrder({
    id:
      "seed-order-toko-20260818",

    farmId:
      farm.id,

    customerId:
      tokoBerkah.id,

    customerNameSnapshot:
      tokoBerkah.name,

    orderedAt:
      new Date(
        "2026-08-18T00:00:00.000Z",
      ),

    quantityKg:
      "100",

    basePricePerKg:
      "28000.00",

    discountPerKg:
      tokoBerkah.discountPerKg.toString(),

    finalPricePerKg:
      currentDiscountFinalPrice,

    totalPrice:
      calculateOrderTotal(
        "100",
        currentDiscountFinalPrice,
      ),

    note:
      "Seed order customer diskon.",
  });

  const warungFinalPrice =
    calculateFinalPricePerKg(
      "28000.00",
      warungMaju.discountPerKg.toString(),
    );

  await ensureOrder({
    id:
      "seed-order-warung-20260818",

    farmId:
      farm.id,

    customerId:
      warungMaju.id,

    customerNameSnapshot:
      warungMaju.name,

    orderedAt:
      new Date(
        "2026-08-18T00:00:00.000Z",
      ),

    quantityKg:
      "25.5",

    basePricePerKg:
      "28000.00",

    discountPerKg:
      warungMaju.discountPerKg.toString(),

    finalPricePerKg:
      warungFinalPrice,

    totalPrice:
      calculateOrderTotal(
        "25.5",
        warungFinalPrice,
      ),

    note:
      "Seed order quantity desimal.",
  });

  const reportA =
    await prisma.dailyReport.upsert({
      where: {
        date_kandangId: {
          date:
            new Date(
              "2026-08-17T00:00:00.000Z",
            ),

          kandangId:
            kandangA.id,
        },
      },

      update: {
        flockId:
          flockA.id,

        operatorId:
          operator.id,

        saleableEgg:
          185.5,

        damagedEgg:
          4.5,

        feedUsed:
          480,

        mortality:
          3,

        incidentalExpense:
          "25000.00",

        incidentalExpenseCategory:
          DailyExpenseCategory.MAINTENANCE,

        incidentNote:
          "Pembersihan saluran air kandang.",

        feedFormulaId:
          formula.id,

        feedFormulaNameSnapshot:
          "Formula Layer Utama",
      },

      create: {
        date:
          new Date(
            "2026-08-17T00:00:00.000Z",
          ),

        kandangId:
          kandangA.id,

        flockId:
          flockA.id,

        operatorId:
          operator.id,

        saleableEgg:
          185.5,

        damagedEgg:
          4.5,

        feedUsed:
          480,

        mortality:
          3,

        incidentalExpense:
          "25000.00",

        incidentalExpenseCategory:
          DailyExpenseCategory.MAINTENANCE,

        incidentNote:
          "Pembersihan saluran air kandang.",

        feedFormulaId:
          formula.id,

        feedFormulaNameSnapshot:
          "Formula Layer Utama",
      },
    });

  const reportB =
    await prisma.dailyReport.upsert({
      where: {
        date_kandangId: {
          date:
            new Date(
              "2026-08-16T00:00:00.000Z",
            ),

          kandangId:
            kandangB.id,
        },
      },

      update: {
        flockId:
          flockB.id,

        operatorId:
          operator.id,

        saleableEgg:
          170,

        damagedEgg:
          null,

        feedUsed:
          430,

        mortality:
          1,

        incidentalExpense:
          null,

        incidentalExpenseCategory:
          null,

        incidentNote:
          "Telur rusak belum direkap.",

        feedFormulaId:
          formula.id,

        feedFormulaNameSnapshot:
          "Formula Layer Utama",
      },

      create: {
        date:
          new Date(
            "2026-08-16T00:00:00.000Z",
          ),

        kandangId:
          kandangB.id,

        flockId:
          flockB.id,

        operatorId:
          operator.id,

        saleableEgg:
          170,

        damagedEgg:
          null,

        feedUsed:
          430,

        mortality:
          1,

        incidentalExpense:
          null,

        incidentalExpenseCategory:
          null,

        incidentNote:
          "Telur rusak belum direkap.",

        feedFormulaId:
          formula.id,

        feedFormulaNameSnapshot:
          "Formula Layer Utama",
      },
    });

  for (
    const report
    of [
      reportA,
      reportB,
    ]
  ) {
    await prisma.$transaction([
      prisma.dailyReportFeedItem.deleteMany({
        where: {
          dailyReportId:
            report.id,
        },
      }),

      prisma.dailyReportFeedItem.createMany({
        data: [
          {
            dailyReportId:
              report.id,

            ingredientId:
              jagung.id,

            ingredientNameSnapshot:
              "Jagung",

            percentage:
              "50.00",
          },
          {
            dailyReportId:
              report.id,

            ingredientId:
              konsentrat.id,

            ingredientNameSnapshot:
              "Konsentrat",

            percentage:
              "35.00",
          },
          {
            dailyReportId:
              report.id,

            ingredientId:
              dedak.id,

            ingredientNameSnapshot:
              "Dedak",

            percentage:
              "15.00",
          },
        ],
      }),
    ]);
  }

  const existingEggOpening =
    await prisma.eggStockAdjustment.findUnique({
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
    !existingEggOpening
  ) {
    await prisma.eggStockAdjustment.create({
      data: {
        id:
          "seed-egg-opening-20260801",

        farmId:
          farm.id,

        occurredAt:
          new Date(
            "2026-08-01T00:00:00.000Z",
          ),

        type:
          EggStockAdjustmentType.OPENING,

        quantityKg:
          "100.000",

        note:
          "Stok awal development.",

        createdById:
          owner.id,

        openingKey:
          farm.id,
      },
    });
  }

  const existingEggAdjustment =
    await prisma.eggStockAdjustment.findUnique({
      where: {
        id:
          "seed-egg-adjustment-20260817",
      },

      select: {
        id:
          true,
      },
    });

  if (
    !existingEggAdjustment
  ) {
    await prisma.eggStockAdjustment.create({
      data: {
        id:
          "seed-egg-adjustment-20260817",

        farmId:
          farm.id,

        occurredAt:
          new Date(
            "2026-08-17T00:00:00.000Z",
          ),

        type:
          EggStockAdjustmentType.DECREASE,

        quantityKg:
          "2.000",

        note:
          "Telur pecah setelah penyimpanan.",

        createdById:
          owner.id,
      },
    });
  }

  await ensureFeedOpening({
    id:
      "seed-feed-opening-jagung",

    farmId:
      farm.id,

    ingredientId:
      jagung.id,

    occurredAt:
      new Date(
        "2026-08-01T00:00:00.000Z",
      ),

    quantityKg:
      "400.000",

    note:
      "Stok awal Jagung development.",

    createdById:
      owner.id,
  });

  await ensureFeedOpening({
    id:
      "seed-feed-opening-konsentrat",

    farmId:
      farm.id,

    ingredientId:
      konsentrat.id,

    occurredAt:
      new Date(
        "2026-08-01T00:00:00.000Z",
      ),

    quantityKg:
      "300.000",

    note:
      "Stok awal Konsentrat development.",

    createdById:
      owner.id,
  });

  await ensureFeedOpening({
    id:
      "seed-feed-opening-dedak",

    farmId:
      farm.id,

    ingredientId:
      dedak.id,

    occurredAt:
      new Date(
        "2026-08-01T00:00:00.000Z",
      ),

    quantityKg:
      "200.000",

    note:
      "Stok awal Dedak development.",

    createdById:
      owner.id,
  });

  await ensureFeedPurchase({
    id:
      "seed-feed-purchase-jagung-20260817",

    farmId:
      farm.id,

    ingredientId:
      jagung.id,

    purchasedAt:
      new Date(
        "2026-08-17T00:00:00.000Z",
      ),

    quantityKg:
      "200.000",

    unitPricePerKg:
      "5500.00",

    supplier:
      "Supplier Development",

    note:
      "Pembelian Jagung development.",

    createdById:
      owner.id,
  });

  await ensureFeedPurchase({
    id:
      "seed-feed-purchase-konsentrat-20260817",

    farmId:
      farm.id,

    ingredientId:
      konsentrat.id,

    purchasedAt:
      new Date(
        "2026-08-17T00:00:00.000Z",
      ),

    quantityKg:
      "150.000",

    unitPricePerKg:
      "8500.00",

    supplier:
      "Supplier Development",

    note:
      "Pembelian Konsentrat development.",

    createdById:
      owner.id,
  });

  await ensureRoutineCost({
    id:
      "seed-routine-cost-salary-202608",

    farmId:
      farm.id,

    category:
      RoutineCostCategory.SALARY,

    name:
      "Gaji Karyawan",

    amount:
      "9300000.00",

    periodStart:
      new Date(
        "2026-08-01T00:00:00.000Z",
      ),

    periodEnd:
      new Date(
        "2026-08-31T00:00:00.000Z",
      ),

    note:
      "Gaji karyawan bulan Agustus 2026.",

    createdById:
      owner.id,
  });

  await ensureRoutineCost({
    id:
      "seed-routine-cost-electricity-202608",

    farmId:
      farm.id,

    category:
      RoutineCostCategory.ELECTRICITY,

    name:
      "Listrik Farm",

    amount:
      "1550000.00",

    periodStart:
      new Date(
        "2026-08-01T00:00:00.000Z",
      ),

    periodEnd:
      new Date(
        "2026-08-31T00:00:00.000Z",
      ),

    note:
      "Biaya listrik bulan Agustus 2026.",

    createdById:
      owner.id,
  });

  await ensureRoutineCost({
    id:
      "seed-routine-cost-water-202608",

    farmId:
      farm.id,

    category:
      RoutineCostCategory.WATER,

    name:
      "Air Farm",

    amount:
      "310000.00",

    periodStart:
      new Date(
        "2026-08-01T00:00:00.000Z",
      ),

    periodEnd:
      new Date(
        "2026-08-31T00:00:00.000Z",
      ),

    note:
      "Biaya air bulan Agustus 2026.",

    createdById:
      owner.id,
  });

  await ensureDailyExpense({
    id:
      "seed-daily-expense-transport-20260817",

    farmId:
      farm.id,

    category:
      DailyExpenseCategory.TRANSPORT,

    amount:
      "200000.00",

    occurredAt:
      new Date(
        "2026-08-17T00:00:00.000Z",
      ),

    description:
      "Transport pengambilan kebutuhan farm.",

    createdById:
      owner.id,
  });

  await ensureDailyExpense({
    id:
      "seed-daily-expense-equipment-20260818",

    farmId:
      farm.id,

    category:
      DailyExpenseCategory.EQUIPMENT,

    amount:
      "125000.00",

    occurredAt:
      new Date(
        "2026-08-18T00:00:00.000Z",
      ),

    description:
      "Pembelian alat operasional kecil.",

    createdById:
      owner.id,
  });

  console.log(
    "Database seed completed.",
  );

  console.log(
    "Development users created.",
  );

  console.log(
    "Farm + Feed master seed completed.",
  );

  console.log(
    "Sales core + Order seed completed.",
  );

  console.log(
    "Daily Operations seed completed.",
  );

  console.log(
    "Egg inventory seed completed.",
  );

  console.log(
    "Feed inventory seed completed.",
  );

  console.log(
    "Routine cost seed completed.",
  );

  console.log(
    "Daily expense seed completed.",
  );
}

main()
  .catch(
    (
      error,
    ) => {
      console.error(
        "Database seed failed.",
      );

      console.error(
        error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
