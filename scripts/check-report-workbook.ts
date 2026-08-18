import assert from "node:assert/strict";

import {
  Workbook,
  type Worksheet,
} from "exceljs";

import {
  buildReportWorkbook,
} from "../src/features/reports/excel/build-report-workbook";

import type {
  ReportExportData,
} from "../src/features/reports/types/report-export";

const EXPECTED_SHEETS = [
  "Ringkasan",
  "Produksi",
  "Penjualan",
  "Biaya",
  "Stok",
];

const sampleData: ReportExportData = {
  summary: {
    period: {
      from: "2026-08-10",
      to: "2026-08-17",
    },

    production: {
      saleableEggKg: "975.000",
      damagedEggKg: "25.000",
      totalEggKg: "1000.000",
      damageRatePercent: "2.50",
      mortalityCount: 3,
      feedUsedKg: "600.000",

      feedIngredients: [
        {
          ingredientId: "jagung",
          ingredientName: "Jagung",
          usageKg: "300.000",
        },

        {
          ingredientId:
            "konsentrat",
          ingredientName:
            "Konsentrat",
          usageKg: "210.000",
        },

        {
          ingredientId: "dedak",
          ingredientName: "Dedak",
          usageKg: "90.000",
        },
      ],
    },

    sales: {
      revenue: "3000000.00",
      soldKg: "100.000",
      orderCount: 1,
      averageSellingPricePerKg:
        "30000.00",
    },

    inventory: {
      asOfDate: "2026-08-17",
      eggStockKg: "-5.000",
      eggStockNegative: true,

      feedStocks: [
        {
          ingredientId: "jagung",
          ingredientName: "Jagung",
          stockKg: "-10.000",
          isNegative: true,
        },

        {
          ingredientId:
            "konsentrat",
          ingredientName:
            "Konsentrat",
          stockKg: "180.000",
          isNegative: false,
        },
      ],
    },

    cost: {
      feedCost: "1000000.00",
      routineCost: "800000.00",
      dailyExpenseCost: "200000.00",
      totalOperationalCost:
        "2000000.00",
    },

    hpp: {
      hppPerKg: "2051.28",
      status: "READY",
    },

    profit: {
      estimatedOperationalProfit:
        "1000000.00",

      operationalMarginPercent:
        "33.33",

      status: "READY",
    },

    dataQuality: {
      completeReports: 1,
      incompleteReports: 0,
      missingFeedCostReports: 0,
      hppStatus: "READY",
      profitStatus: "READY",
      warnings: [],
    },
  },

  dailyReports: [
    {
      id: "report-1",
      date: "2026-08-15",

      kandangName: "Kandang A",
      flockName: "Flock A",
      operatorName: "Operator",

      status: "COMPLETE",

      saleableEggKg: "975.000",
      damagedEggKg: "25.000",
      feedUsedKg: "600.000",
      mortality: 3,

      feedFormulaNameSnapshot:
        "Formula A",

      feedCompositionSnapshot:
        "Jagung 50.00% | Konsentrat 35.00% | Dedak 15.00%",

      incidentalExpense:
        "150000.00",

      incidentalExpenseCategoryLabel:
        "Obat & Vitamin",

      incidentNote:
        "Vitamin ayam Kandang A",
    },
  ],

  orders: [
    {
      id: "order-1",
      orderedAt: "2026-08-15",

      customerNameSnapshot:
        "Toko Berkah",

      quantityKg: "100.000",

      basePricePerKg: "30500.00",
      discountPerKg: "500.00",
      finalPricePerKg: "30000.00",

      totalPrice: "3000000.00",

      note: null,
    },
  ],

  routineCosts: [
    {
      id: "routine-1",

      categoryLabel: "Gaji",
      name: "Gaji Karyawan",

      amount: "3100000.00",

      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",

      allocationInPeriod:
        "800000.00",

      note: null,
    },
  ],

  ownerDailyExpenses: [
    {
      id: "expense-owner-1",
      occurredAt: "2026-08-15",
      categoryLabel: "Transportasi",
      amount: "50000.00",
      description:
        "Transport kebutuhan farm",
    },
  ],

  operationExpenses: [
    {
      dailyReportId: "report-1",
      occurredAt: "2026-08-15",
      categoryLabel:
        "Obat & Vitamin",
      amount: "150000.00",
      kandangName: "Kandang A",
      operatorName: "Operator",
      description:
        "Vitamin ayam Kandang A",
    },
  ],
};

function getSheet(
  workbook: Workbook,
  name: string,
): Worksheet {
  const worksheet =
    workbook.getWorksheet(
      name,
    );

  assert.ok(
    worksheet,
    `Sheet ${name} tidak ditemukan.`,
  );

  return worksheet;
}

function assertNumberCell(
  worksheet: Worksheet,
  address: string,
  expected?: number,
): void {
  const value =
    worksheet.getCell(
      address,
    ).value;

  assert.equal(
    typeof value,
    "number",
    `${worksheet.name}!${address} harus numeric cell.`,
  );

  if (
    expected !== undefined
  ) {
    assert.ok(
      Math.abs(
        (value as number) -
          expected,
      ) <
        1e-9,
      `${worksheet.name}!${address} expected ${expected}, actual ${value}`,
    );
  }
}

function assertDateCell(
  worksheet: Worksheet,
  address: string,
  expectedDate: string,
): void {
  const value =
    worksheet.getCell(
      address,
    ).value;

  assert.ok(
    value instanceof Date,
    `${worksheet.name}!${address} harus Excel date cell.`,
  );

  assert.equal(
    value
      .toISOString()
      .slice(
        0,
        10,
      ),
    expectedDate,
    `${worksheet.name}!${address} bergeser tanggal.`,
  );
}

async function loadWorkbook(
  data: ReportExportData,
): Promise<Workbook> {
  const buffer =
    await buildReportWorkbook(
      data,
    );

  const workbook =
    new Workbook();

  await workbook.xlsx.load(
    buffer as unknown as ArrayBuffer,
  );

  return workbook;
}

async function checkPopulatedWorkbook(): Promise<void> {
  const workbook =
    await loadWorkbook(
      sampleData,
    );

  assert.deepEqual(
    workbook.worksheets.map(
      (
        worksheet,
      ) =>
        worksheet.name,
    ),
    EXPECTED_SHEETS,
    "Workbook harus memiliki tepat lima sheet utama.",
  );

  const summary =
    getSheet(
      workbook,
      "Ringkasan",
    );

  assertNumberCell(
    summary,
    "B6",
    975,
  );

  assertNumberCell(
    summary,
    "B8",
    0.025,
  );

  assertNumberCell(
    summary,
    "B13",
    3000000,
  );

  assertNumberCell(
    summary,
    "B15",
    1,
  );

  assertNumberCell(
    summary,
    "B19",
    1000000,
  );

  assertNumberCell(
    summary,
    "B20",
    800000,
  );

  assertNumberCell(
    summary,
    "B22",
    2000000,
  );

  assertNumberCell(
    summary,
    "B25",
    2051.28,
  );

  assertNumberCell(
    summary,
    "B26",
    1000000,
  );

  /*
   * 33.33% harus disimpan sebagai 0.3333,
   * bukan 33.33.
   */
  assertNumberCell(
    summary,
    "B27",
    0.3333,
  );

  assertNumberCell(
    summary,
    "B32",
    1,
  );

  const production =
    getSheet(
      workbook,
      "Produksi",
    );

  assertDateCell(
    production,
    "A2",
    "2026-08-15",
  );

  assertNumberCell(
    production,
    "F2",
    975,
  );

  assertNumberCell(
    production,
    "G2",
    25,
  );

  assertNumberCell(
    production,
    "H2",
    600,
  );

  assertNumberCell(
    production,
    "L2",
    150000,
  );

  const sales =
    getSheet(
      workbook,
      "Penjualan",
    );

  assertDateCell(
    sales,
    "A2",
    "2026-08-15",
  );

  assertNumberCell(
    sales,
    "C2",
    100,
  );

  assertNumberCell(
    sales,
    "D2",
    30500,
  );

  assertNumberCell(
    sales,
    "F2",
    30000,
  );

  assertNumberCell(
    sales,
    "G2",
    3000000,
  );

  const costs =
    getSheet(
      workbook,
      "Biaya",
    );

  assertDateCell(
    costs,
    "C2",
    "2026-08-01",
  );

  assertDateCell(
    costs,
    "D2",
    "2026-08-31",
  );

  assertNumberCell(
    costs,
    "G2",
    3100000,
  );

  assertNumberCell(
    costs,
    "H2",
    800000,
  );

  assertNumberCell(
    costs,
    "I3",
    50000,
  );

  assertNumberCell(
    costs,
    "I4",
    150000,
  );

  const stock =
    getSheet(
      workbook,
      "Stok",
    );

  assertDateCell(
    stock,
    "B4",
    "2026-08-17",
  );

  assertNumberCell(
    stock,
    "B5",
    -5,
  );

  assertNumberCell(
    stock,
    "B10",
    -10,
  );
}

async function checkEmptyWorkbook(): Promise<void> {
  const emptyData: ReportExportData =
    {
      ...sampleData,

      summary: {
        ...sampleData.summary,

        production: {
          saleableEggKg: "0.000",
          damagedEggKg: "0.000",
          totalEggKg: "0.000",
          damageRatePercent: null,
          mortalityCount: 0,
          feedUsedKg: "0.000",
          feedIngredients: [],
        },

        sales: {
          revenue: "0.00",
          soldKg: "0.000",
          orderCount: 0,
          averageSellingPricePerKg:
            null,
        },

        inventory: {
          asOfDate:
            "2026-08-17",
          eggStockKg: "0.000",
          eggStockNegative: false,
          feedStocks: [],
        },

        cost: {
          feedCost: "0.00",
          routineCost: "0.00",
          dailyExpenseCost: "0.00",
          totalOperationalCost:
            "0.00",
        },

        hpp: {
          hppPerKg: null,
          status:
            "NO_PRODUCTION",
        },

        profit: {
          estimatedOperationalProfit:
            "0.00",

          operationalMarginPercent:
            null,

          status:
            "NO_REVENUE",
        },

        dataQuality: {
          completeReports: 0,
          incompleteReports: 0,
          missingFeedCostReports: 0,
          hppStatus:
            "NO_PRODUCTION",
          profitStatus:
            "NO_REVENUE",
          warnings: [],
        },
      },

      dailyReports: [],
      orders: [],
      routineCosts: [],
      ownerDailyExpenses: [],
      operationExpenses: [],
    };

  const workbook =
    await loadWorkbook(
      emptyData,
    );

  assert.deepEqual(
    workbook.worksheets.map(
      (
        worksheet,
      ) =>
        worksheet.name,
    ),
    EXPECTED_SHEETS,
  );

  assert.equal(
    getSheet(
      workbook,
      "Produksi",
    ).rowCount,
    1,
  );

  assert.equal(
    getSheet(
      workbook,
      "Penjualan",
    ).rowCount,
    1,
  );

  assert.equal(
    getSheet(
      workbook,
      "Biaya",
    ).rowCount,
    1,
  );

  assertNumberCell(
    getSheet(
      workbook,
      "Ringkasan",
    ),
    "B6",
    0,
  );

  assertNumberCell(
    getSheet(
      workbook,
      "Ringkasan",
    ),
    "B13",
    0,
  );
}

async function main(): Promise<void> {
  await checkPopulatedWorkbook();

  await checkEmptyWorkbook();

  console.log(
    "Report workbook QA: OK",
  );

  console.log(
    `Sheets: ${EXPECTED_SHEETS.join(
      ", ",
    )}`,
  );
}

main().catch(
  (
    error,
  ) => {
    console.error(
      "Report workbook QA: FAILED",
    );

    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);