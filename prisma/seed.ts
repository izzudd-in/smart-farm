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
  FeedCostBasis,
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
  const totalPrice = calculateFeedPurchaseTotal(data.quantityKg, data.unitPricePerKg);
  return prisma.feedPurchase.upsert({
    where: {
      id: data.id,
    },
    update: {
      quantityKg: data.quantityKg,
      unitPricePerKg: data.unitPricePerKg,
      totalPrice,
      supplier: data.supplier,
      note: data.note,
    },
    create: {
      ...data,
      totalPrice,
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
  return prisma.feedStockAdjustment.upsert({
    where: {
      openingKey: data.ingredientId,
    },
    update: {
      quantityKg: data.quantityKg,
    },
    create: {
      ...data,
      type: FeedStockAdjustmentType.OPENING,
      openingKey: data.ingredientId,
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

  // --- START DYNAMIC SEEDING ---
  
  const customers = [
    { name: "Toko Berkah", phone: "081234567890", address: "Jember", discount: "500.00" },
    { name: "Warung Maju", phone: "081298765432", address: "Jember", discount: "0.00" },
    { name: "Agen Mandiri", phone: "082211223344", address: "Banyuwangi", discount: "1000.00" },
    { name: "Eceran Farm", phone: "081199998888", address: "Jember", discount: "0.00" }
  ];
  
  const customerRecords = [];
  for (const c of customers) {
    customerRecords.push(await ensureCustomer(farm.id, {
      name: c.name,
      phone: c.phone,
      address: c.address,
      discountPerKg: c.discount
    }));
  }

  // Set Egg Prices over the month
  await ensureEggPrice(farm.id, new Date("2026-08-01T00:00:00.000Z"), "27000.00");
  await ensureEggPrice(farm.id, new Date("2026-08-08T00:00:00.000Z"), "27500.00");
  await ensureEggPrice(farm.id, new Date("2026-08-15T00:00:00.000Z"), "28000.00");

  // Initial Openings
  await prisma.eggStockAdjustment.upsert({
    where: { openingKey: farm.id },
    update: { quantityKg: "3000.000" },
    create: {
      id: "seed-egg-opening-20260801",
      farmId: farm.id,
      occurredAt: new Date("2026-08-01T00:00:00.000Z"),
      type: EggStockAdjustmentType.OPENING,
      quantityKg: "3000.000",
      note: "Stok awal development.",
      createdById: owner.id,
      openingKey: farm.id
    }
  });

  await ensureFeedOpening({
    id: "seed-feed-opening-jagung",
    farmId: farm.id,
    ingredientId: jagung.id,
    occurredAt: new Date("2026-08-01T00:00:00.000Z"),
    quantityKg: "5000.000",
    note: "Stok awal Jagung development.",
    createdById: owner.id,
  });
  await ensureFeedOpening({
    id: "seed-feed-opening-konsentrat",
    farmId: farm.id,
    ingredientId: konsentrat.id,
    occurredAt: new Date("2026-08-01T00:00:00.000Z"),
    quantityKg: "4000.000",
    note: "Stok awal Konsentrat development.",
    createdById: owner.id,
  });
  await ensureFeedOpening({
    id: "seed-feed-opening-dedak",
    farmId: farm.id,
    ingredientId: dedak.id,
    occurredAt: new Date("2026-08-01T00:00:00.000Z"),
    quantityKg: "2000.000",
    note: "Stok awal Dedak development.",
    createdById: owner.id,
  });

  // Loop 14 days (Aug 1 to Aug 14) for daily operations
  for (let d = 1; d <= 14; d++) {
    const dateStr = `2026-08-${d.toString().padStart(2, '0')}T00:00:00.000Z`;
    const reportDate = new Date(dateStr);

    // DAILY REPORTS for Kandang A
    const kandangAMortality = Math.floor(Math.random() * 3);
    const reportA = await prisma.dailyReport.upsert({
      where: { date_kandangId: { date: reportDate, kandangId: kandangA.id } },
      update: {},
      create: {
        date: reportDate,
        kandangId: kandangA.id,
        flockId: flockA.id,
        operatorId: operator.id,
        saleableEgg: 180 + Math.floor(Math.random() * 15),
        damagedEgg: Math.floor(Math.random() * 5),
        feedUsed: 470 + Math.floor(Math.random() * 10),
        mortality: kandangAMortality,
        incidentalExpense: kandangAMortality > 1 ? "25000.00" : null,
        incidentalExpenseCategory: kandangAMortality > 1 ? DailyExpenseCategory.MEDICINE_VITAMIN : null,
        incidentNote: kandangAMortality > 1 ? "Beli vitamin tambahan" : null,
        feedFormulaId: formula.id,
        feedFormulaNameSnapshot: "Formula Layer Utama"
      }
    });

    // DAILY REPORTS for Kandang B
    const kandangBMortality = Math.floor(Math.random() * 2);
    const reportB = await prisma.dailyReport.upsert({
      where: { date_kandangId: { date: reportDate, kandangId: kandangB.id } },
      update: {},
      create: {
        date: reportDate,
        kandangId: kandangB.id,
        flockId: flockB.id,
        operatorId: operator.id,
        saleableEgg: 160 + Math.floor(Math.random() * 10),
        damagedEgg: Math.floor(Math.random() * 3),
        feedUsed: 430 + Math.floor(Math.random() * 10),
        mortality: kandangBMortality,
        feedFormulaId: formula.id,
        feedFormulaNameSnapshot: "Formula Layer Utama"
      }
    });

    for (const report of [reportA, reportB]) {
      await prisma.dailyReportFeedItem.deleteMany({
        where: { dailyReportId: report.id }
      });
      
      await prisma.dailyReportFeedItem.createMany({
        data: [
          { 
            dailyReportId: report.id, 
            ingredientId: jagung.id, 
            ingredientNameSnapshot: "Jagung", 
            percentage: "50.00",
            unitCostPerKgSnapshot: "5500.00",
            costBasisSnapshot: FeedCostBasis.LATEST_PURCHASE
          },
          { 
            dailyReportId: report.id, 
            ingredientId: konsentrat.id, 
            ingredientNameSnapshot: "Konsentrat", 
            percentage: "35.00",
            unitCostPerKgSnapshot: "8500.00",
            costBasisSnapshot: FeedCostBasis.LATEST_PURCHASE
          },
          { 
            dailyReportId: report.id, 
            ingredientId: dedak.id, 
            ingredientNameSnapshot: "Dedak", 
            percentage: "15.00",
            unitCostPerKgSnapshot: "3500.00",
            costBasisSnapshot: FeedCostBasis.LATEST_PURCHASE
          },
        ]
      });
    }

    // ORDERS
    // 1-3 orders per day
    const numOrders = 1 + Math.floor(Math.random() * 3);
    for (let o = 0; o < numOrders; o++) {
      const customer = customerRecords[Math.floor(Math.random() * customerRecords.length)];
      let basePrice = "27000.00";
      if (d >= 8) basePrice = "27500.00";
      if (d >= 15) basePrice = "28000.00";

      const qty = [25.5, 50, 100, 150][Math.floor(Math.random() * 4)];
      const finalPrice = calculateFinalPricePerKg(basePrice, customer.discountPerKg.toString());
      
      await ensureOrder({
        id: `seed-order-${d}-${o}-${customer.id.substring(0,5)}`,
        farmId: farm.id,
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        orderedAt: reportDate,
        quantityKg: qty.toString(),
        basePricePerKg: basePrice,
        discountPerKg: customer.discountPerKg.toString(),
        finalPricePerKg: finalPrice,
        totalPrice: calculateOrderTotal(qty.toString(), finalPrice),
        note: "Transaksi seed."
      });
    }

    // RANDOM EXPENSES (every 5 days)
    if (d % 5 === 0) {
      await ensureDailyExpense({
        id: `seed-daily-expense-${d}`,
        farmId: farm.id,
        category: DailyExpenseCategory.TRANSPORT,
        amount: "150000.00",
        occurredAt: reportDate,
        description: "Transport pakan dan telur",
        createdById: owner.id
      });
    }

    // FEED PURCHASES (Weekly on day 7 and 14)
    if (d === 7 || d === 14) {
      await ensureFeedPurchase({
        id: `seed-feed-purchase-jagung-${d}`,
        farmId: farm.id,
        ingredientId: jagung.id,
        purchasedAt: reportDate,
        quantityKg: "1500.000",
        unitPricePerKg: "5500.00",
        supplier: "Supplier Jagung",
        note: "Restock mingguan",
        createdById: owner.id
      });
      await ensureFeedPurchase({
        id: `seed-feed-purchase-konsentrat-${d}`,
        farmId: farm.id,
        ingredientId: konsentrat.id,
        purchasedAt: reportDate,
        quantityKg: "1000.000",
        unitPricePerKg: "8500.00",
        supplier: "Supplier Konsentrat",
        note: "Restock mingguan",
        createdById: owner.id
      });
      await ensureFeedPurchase({
        id: `seed-feed-purchase-dedak-${d}`,
        farmId: farm.id,
        ingredientId: dedak.id,
        purchasedAt: reportDate,
        quantityKg: "500.000",
        unitPricePerKg: "3500.00",
        supplier: "Supplier Dedak",
        note: "Restock mingguan",
        createdById: owner.id
      });
    }
  }

  // Routine Costs (Monthly)
  await ensureRoutineCost({
    id: "seed-routine-cost-salary-202608",
    farmId: farm.id,
    category: RoutineCostCategory.SALARY,
    name: "Gaji Karyawan",
    amount: "9300000.00",
    periodStart: new Date("2026-08-01T00:00:00.000Z"),
    periodEnd: new Date("2026-08-31T00:00:00.000Z"),
    note: "Gaji karyawan bulan Agustus 2026.",
    createdById: owner.id,
  });
  await ensureRoutineCost({
    id: "seed-routine-cost-electricity-202608",
    farmId: farm.id,
    category: RoutineCostCategory.ELECTRICITY,
    name: "Listrik Farm",
    amount: "1550000.00",
    periodStart: new Date("2026-08-01T00:00:00.000Z"),
    periodEnd: new Date("2026-08-31T00:00:00.000Z"),
    note: "Biaya listrik bulan Agustus 2026.",
    createdById: owner.id,
  });
  await ensureRoutineCost({
    id: "seed-routine-cost-water-202608",
    farmId: farm.id,
    category: RoutineCostCategory.WATER,
    name: "Air Farm",
    amount: "310000.00",
    periodStart: new Date("2026-08-01T00:00:00.000Z"),
    periodEnd: new Date("2026-08-31T00:00:00.000Z"),
    note: "Biaya air bulan Agustus 2026.",
    createdById: owner.id,
  });
  // --- END DYNAMIC SEEDING ---
  
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
