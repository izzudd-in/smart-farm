import type {
  Buffer,
} from "node:buffer";

import {
  Workbook,
  type Cell,
  type Row,
  type Worksheet,
} from "exceljs";

import type {
  ReportExportData,
} from "@/features/reports/types/report-export";

const BRAND_GREEN =
  "FF16A34A";

const BRAND_SOFT_GREEN =
  "FFF0FDF4";

const TEXT_DARK =
  "FF111827";

const TEXT_MUTED =
  "FF6B7280";

const BORDER =
  "FFE5E7EB";

const WHITE =
  "FFFFFFFF";

const MONEY_FORMAT =
  "#,##0.00";

const QUANTITY_FORMAT =
  "0.000";

const PERCENT_FORMAT =
  "0.00%";

const DATE_FORMAT =
  "dd mmm yyyy";

function toSafeExcelNumber(
  value: string,
  scale: number,
): number {
  const normalized =
    value.trim();

  if (
    !/^-?\d+(\.\d+)?$/.test(
      normalized,
    )
  ) {
    throw new Error(
      "Invalid numeric export value.",
    );
  }

  const numeric =
    Number(normalized);

  const multiplier =
    10 ** scale;

  if (
    !Number.isFinite(numeric) ||
    !Number.isSafeInteger(
      Math.round(
        numeric *
          multiplier,
      ),
    )
  ) {
    throw new Error(
      "Export value exceeds safe Excel numeric precision.",
    );
  }

  return numeric;
}

function toExcelMoney(
  value: string,
): number {
  return toSafeExcelNumber(
    value,
    2,
  );
}

function toExcelQuantity(
  value: string,
): number {
  return toSafeExcelNumber(
    value,
    3,
  );
}

function toExcelPercent(
  value: string,
): number {
  return (
    toSafeExcelNumber(
      value,
      2,
    ) /
    100
  );
}

function toExcelBusinessDate(
  value: string,
): Date {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    );

  if (!match) {
    throw new Error(
      "Invalid business date.",
    );
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    throw new Error(
      "Invalid business date.",
    );
  }

  return date;
}

function formatPeriodDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      `${value}T00:00:00.000Z`,
    ),
  );
}

function applyHeaderStyle(
  row: Row,
): void {
  row.height =
    24;

  row.eachCell(
    (cell) => {
      cell.font = {
        bold: true,
        color: {
          argb: WHITE,
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: BRAND_GREEN,
        },
      };

      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };

      cell.border = {
        bottom: {
          style: "thin",
          color: {
            argb: BORDER,
          },
        },
      };
    },
  );
}

function applySectionTitle(
  worksheet: Worksheet,
  rowNumber: number,
  title: string,
  lastColumn = 4,
): void {
  worksheet.mergeCells(
    rowNumber,
    1,
    rowNumber,
    lastColumn,
  );

  const cell =
    worksheet.getCell(
      rowNumber,
      1,
    );

  cell.value =
    title;

  cell.font = {
    bold: true,
    color: {
      argb: BRAND_GREEN,
    },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: BRAND_SOFT_GREEN,
    },
  };

  cell.alignment = {
    vertical: "middle",
  };

  worksheet.getRow(
    rowNumber,
  ).height =
    22;
}

function setMoneyCell(
  cell: Cell,
  value: string | null,
): void {
  if (value === null) {
    cell.value =
      "Belum lengkap";

    return;
  }

  cell.value =
    toExcelMoney(value);

  cell.numFmt =
    MONEY_FORMAT;
}

function setQuantityCell(
  cell: Cell,
  value: string | null,
): void {
  if (value === null) {
    cell.value =
      null;

    return;
  }

  cell.value =
    toExcelQuantity(
      value,
    );

  cell.numFmt =
    QUANTITY_FORMAT;
}

function setPercentCell(
  cell: Cell,
  value: string | null,
): void {
  if (value === null) {
    cell.value =
      "Belum lengkap";

    return;
  }

  cell.value =
    toExcelPercent(
      value,
    );

  cell.numFmt =
    PERCENT_FORMAT;
}

function setDateCell(
  cell: Cell,
  value: string,
): void {
  cell.value =
    toExcelBusinessDate(
      value,
    );

  cell.numFmt =
    DATE_FORMAT;
}

function setColumnWidths(
  worksheet: Worksheet,
  widths: number[],
): void {
  widths.forEach(
    (
      width,
      index,
    ) => {
      worksheet.getColumn(
        index + 1,
      ).width =
        width;
    },
  );
}

function freezeAndFilter(
  worksheet: Worksheet,
  columnCount: number,
): void {
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  worksheet.autoFilter = {
    from: {
      row: 1,
      column: 1,
    },

    to: {
      row: 1,
      column: columnCount,
    },
  };
}

function addSummaryLabel(
  worksheet: Worksheet,
  rowNumber: number,
  label: string,
): Cell {
  const labelCell =
    worksheet.getCell(
      rowNumber,
      1,
    );

  labelCell.value =
    label;

  labelCell.font = {
    color: {
      argb: TEXT_MUTED,
    },
  };

  const valueCell =
    worksheet.getCell(
      rowNumber,
      2,
    );

  valueCell.font = {
    bold: true,
    color: {
      argb: TEXT_DARK,
    },
  };

  return valueCell;
}

function addSummaryTextMetric(
  worksheet: Worksheet,
  rowNumber: number,
  label: string,
  value: string,
): void {
  addSummaryLabel(
    worksheet,
    rowNumber,
    label,
  ).value =
    value;
}

function addSummaryIntegerMetric(
  worksheet: Worksheet,
  rowNumber: number,
  label: string,
  value: number,
  unit?: string,
): void {
  addSummaryLabel(
    worksheet,
    rowNumber,
    label,
  ).value =
    value;

  if (unit) {
    worksheet.getCell(
      rowNumber,
      3,
    ).value =
      unit;
  }
}

function addSummaryMoneyMetric(
  worksheet: Worksheet,
  rowNumber: number,
  label: string,
  value: string | null,
): void {
  const cell =
    addSummaryLabel(
      worksheet,
      rowNumber,
      label,
    );

  setMoneyCell(
    cell,
    value,
  );
}

function addSummaryQuantityMetric(
  worksheet: Worksheet,
  rowNumber: number,
  label: string,
  value: string,
): void {
  const cell =
    addSummaryLabel(
      worksheet,
      rowNumber,
      label,
    );

  setQuantityCell(
    cell,
    value,
  );

  worksheet.getCell(
    rowNumber,
    3,
  ).value =
    "kg";
}

function addSummaryPercentMetric(
  worksheet: Worksheet,
  rowNumber: number,
  label: string,
  value: string | null,
): void {
  const cell =
    addSummaryLabel(
      worksheet,
      rowNumber,
      label,
    );

  setPercentCell(
    cell,
    value,
  );
}

function buildSummarySheet(
  workbook: Workbook,
  data: ReportExportData,
): void {
  const {
    summary,
  } = data;

  const worksheet =
    workbook.addWorksheet(
      "Ringkasan",
      {
        views: [
          {
            showGridLines:
              false,
          },
        ],
      },
    );

  setColumnWidths(
    worksheet,
    [
      34,
      24,
      16,
      34,
    ],
  );

  worksheet.mergeCells(
    "A1:D1",
  );

  worksheet.getCell(
    "A1",
  ).value =
    "UdinFarm";

  worksheet.getCell(
    "A1",
  ).font = {
    bold: true,
    size: 18,
    color: {
      argb: BRAND_GREEN,
    },
  };

  worksheet.mergeCells(
    "A2:D2",
  );

  worksheet.getCell(
    "A2",
  ).value =
    "Laporan Operasional";

  worksheet.getCell(
    "A2",
  ).font = {
    bold: true,
    size: 14,
    color: {
      argb: TEXT_DARK,
    },
  };

  worksheet.mergeCells(
    "A3:D3",
  );

  worksheet.getCell(
    "A3",
  ).value =
    `Periode: ${formatPeriodDate(
      summary.period.from,
    )} – ${formatPeriodDate(
      summary.period.to,
    )}`;

  worksheet.getCell(
    "A3",
  ).font = {
    color: {
      argb: TEXT_MUTED,
    },
  };

  applySectionTitle(
    worksheet,
    5,
    "Produksi",
  );

  addSummaryQuantityMetric(
    worksheet,
    6,
    "Telur Jual",
    summary.production
      .saleableEggKg,
  );

  addSummaryQuantityMetric(
    worksheet,
    7,
    "Telur Rusak",
    summary.production
      .damagedEggKg,
  );

  addSummaryPercentMetric(
    worksheet,
    8,
    "Persentase Rusak",
    summary.production
      .damageRatePercent,
  );

  addSummaryIntegerMetric(
    worksheet,
    9,
    "Mortalitas",
    summary.production
      .mortalityCount,
    "ekor",
  );

  addSummaryQuantityMetric(
    worksheet,
    10,
    "Pakan Digunakan",
    summary.production
      .feedUsedKg,
  );

  applySectionTitle(
    worksheet,
    12,
    "Penjualan",
  );

  addSummaryMoneyMetric(
    worksheet,
    13,
    "Omzet",
    summary.sales.revenue,
  );

  addSummaryQuantityMetric(
    worksheet,
    14,
    "Terjual",
    summary.sales.soldKg,
  );

  addSummaryIntegerMetric(
    worksheet,
    15,
    "Jumlah Order",
    summary.sales.orderCount,
  );

  addSummaryMoneyMetric(
    worksheet,
    16,
    "Rata-rata Harga Jual / kg",
    summary.sales
      .averageSellingPricePerKg,
  );

  applySectionTitle(
    worksheet,
    18,
    "Biaya",
  );

  addSummaryMoneyMetric(
    worksheet,
    19,
    "Biaya Pakan",
    summary.cost.feedCost,
  );

  addSummaryMoneyMetric(
    worksheet,
    20,
    "Alokasi Biaya Rutin",
    summary.cost.routineCost,
  );

  addSummaryMoneyMetric(
    worksheet,
    21,
    "Pengeluaran Harian",
    summary.cost
      .dailyExpenseCost,
  );

  addSummaryMoneyMetric(
    worksheet,
    22,
    "Total Biaya Operasional",
    summary.cost
      .totalOperationalCost,
  );

  applySectionTitle(
    worksheet,
    24,
    "HPP & Profit",
  );

  addSummaryMoneyMetric(
    worksheet,
    25,
    "HPP Operasional / kg",
    summary.hpp.hppPerKg,
  );

  addSummaryMoneyMetric(
    worksheet,
    26,
    "Estimasi Profit Operasional",
    summary.profit
      .estimatedOperationalProfit,
  );

  addSummaryPercentMetric(
    worksheet,
    27,
    "Margin Operasional",
    summary.profit
      .operationalMarginPercent,
  );

  addSummaryTextMetric(
    worksheet,
    28,
    "HPP Status",
    summary.hpp.status,
  );

  addSummaryTextMetric(
    worksheet,
    29,
    "Profit Status",
    summary.profit.status,
  );

  applySectionTitle(
    worksheet,
    31,
    "Data Quality",
  );

  addSummaryIntegerMetric(
    worksheet,
    32,
    "Complete Reports",
    summary.dataQuality
      .completeReports,
  );

  addSummaryIntegerMetric(
    worksheet,
    33,
    "Incomplete Reports",
    summary.dataQuality
      .incompleteReports,
  );

  addSummaryIntegerMetric(
    worksheet,
    34,
    "Missing Feed Cost Reports",
    summary.dataQuality
      .missingFeedCostReports,
  );

  let warningRow =
    36;

  for (
    const warning
    of summary.dataQuality
      .warnings
  ) {
    worksheet.mergeCells(
      warningRow,
      1,
      warningRow,
      4,
    );

    const cell =
      worksheet.getCell(
        warningRow,
        1,
      );

    cell.value =
      `Peringatan: ${warning}`;

    cell.font = {
      color: {
        argb: "FF92400E",
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFFFBEB",
      },
    };

    cell.alignment = {
      wrapText: true,
      vertical: "top",
    };

    warningRow +=
      1;
  }
}

function buildProductionSheet(
  workbook: Workbook,
  data: ReportExportData,
): void {
  const worksheet =
    workbook.addWorksheet(
      "Produksi",
    );

  const headers = [
    "Tanggal",
    "Kandang",
    "Flock",
    "Operator",
    "Status",
    "Telur Jual (kg)",
    "Telur Rusak (kg)",
    "Pakan Digunakan (kg)",
    "Ayam Mati",
    "Formula Snapshot",
    "Komposisi Pakan",
    "Pengeluaran Operasional",
    "Kategori Pengeluaran",
    "Catatan",
  ];

  worksheet.addRow(
    headers,
  );

  applyHeaderStyle(
    worksheet.getRow(1),
  );

  setColumnWidths(
    worksheet,
    [
      15,
      18,
      18,
      22,
      14,
      17,
      18,
      22,
      12,
      24,
      50,
      24,
      24,
      45,
    ],
  );

  freezeAndFilter(
    worksheet,
    headers.length,
  );

  for (
    const report
    of data.dailyReports
  ) {
    const row =
      worksheet.addRow([
        toExcelBusinessDate(
          report.date,
        ),

        report.kandangName,
        report.flockName,
        report.operatorName,
        report.status,

        report.saleableEggKg ===
        null
          ? null
          : toExcelQuantity(
              report.saleableEggKg,
            ),

        report.damagedEggKg ===
        null
          ? null
          : toExcelQuantity(
              report.damagedEggKg,
            ),

        report.feedUsedKg ===
        null
          ? null
          : toExcelQuantity(
              report.feedUsedKg,
            ),

        report.mortality,

        report.feedFormulaNameSnapshot ??
          "",

        report.feedCompositionSnapshot,

        report.incidentalExpense ===
        null
          ? null
          : toExcelMoney(
              report.incidentalExpense,
            ),

        report.incidentalExpenseCategoryLabel ??
          "",

        report.incidentNote ??
          "",
      ]);

    row.getCell(1).numFmt =
      DATE_FORMAT;

    row.getCell(6).numFmt =
      QUANTITY_FORMAT;

    row.getCell(7).numFmt =
      QUANTITY_FORMAT;

    row.getCell(8).numFmt =
      QUANTITY_FORMAT;

    row.getCell(12).numFmt =
      MONEY_FORMAT;

    row.alignment = {
      vertical: "top",
    };

    row.getCell(
      11,
    ).alignment = {
      wrapText: true,
      vertical: "top",
    };

    row.getCell(
      14,
    ).alignment = {
      wrapText: true,
      vertical: "top",
    };
  }
}

function buildSalesSheet(
  workbook: Workbook,
  data: ReportExportData,
): void {
  const worksheet =
    workbook.addWorksheet(
      "Penjualan",
    );

  const headers = [
    "Tanggal",
    "Customer",
    "Quantity (kg)",
    "Harga Dasar/kg",
    "Diskon/kg",
    "Harga Final/kg",
    "Total",
    "Catatan",
  ];

  worksheet.addRow(
    headers,
  );

  applyHeaderStyle(
    worksheet.getRow(1),
  );

  setColumnWidths(
    worksheet,
    [
      15,
      28,
      18,
      20,
      18,
      20,
      22,
      45,
    ],
  );

  freezeAndFilter(
    worksheet,
    headers.length,
  );

  for (
    const order
    of data.orders
  ) {
    const row =
      worksheet.addRow([
        toExcelBusinessDate(
          order.orderedAt,
        ),

        order.customerNameSnapshot,

        toExcelQuantity(
          order.quantityKg,
        ),

        toExcelMoney(
          order.basePricePerKg,
        ),

        toExcelMoney(
          order.discountPerKg,
        ),

        toExcelMoney(
          order.finalPricePerKg,
        ),

        toExcelMoney(
          order.totalPrice,
        ),

        order.note ??
          "",
      ]);

    row.getCell(1).numFmt =
      DATE_FORMAT;

    row.getCell(3).numFmt =
      QUANTITY_FORMAT;

    for (
      const column
      of [
        4,
        5,
        6,
        7,
      ]
    ) {
      row.getCell(
        column,
      ).numFmt =
        MONEY_FORMAT;
    }

    row.getCell(
      8,
    ).alignment = {
      wrapText: true,
      vertical: "top",
    };
  }
}

function buildCostsSheet(
  workbook: Workbook,
  data: ReportExportData,
): void {
  const worksheet =
    workbook.addWorksheet(
      "Biaya",
    );

  const headers = [
    "Jenis",
    "Tanggal",
    "Periode Mulai",
    "Periode Selesai",
    "Kategori",
    "Nama",
    "Nominal Asli",
    "Alokasi Dalam Periode",
    "Nominal",
    "Kandang",
    "Operator",
    "Keterangan",
  ];

  worksheet.addRow(
    headers,
  );

  applyHeaderStyle(
    worksheet.getRow(1),
  );

  setColumnWidths(
    worksheet,
    [
      18,
      15,
      15,
      15,
      24,
      28,
      20,
      25,
      20,
      20,
      22,
      45,
    ],
  );

  freezeAndFilter(
    worksheet,
    headers.length,
  );

  for (
    const cost
    of data.routineCosts
  ) {
    const row =
      worksheet.addRow([
        "BIAYA RUTIN",
        null,

        toExcelBusinessDate(
          cost.periodStart,
        ),

        toExcelBusinessDate(
          cost.periodEnd,
        ),

        cost.categoryLabel,
        cost.name,

        toExcelMoney(
          cost.amount,
        ),

        toExcelMoney(
          cost.allocationInPeriod,
        ),

        null,
        "",
        "",

        cost.note ??
          "",
      ]);

    row.getCell(3).numFmt =
      DATE_FORMAT;

    row.getCell(4).numFmt =
      DATE_FORMAT;

    row.getCell(7).numFmt =
      MONEY_FORMAT;

    row.getCell(8).numFmt =
      MONEY_FORMAT;
  }

  for (
    const expense
    of data.ownerDailyExpenses
  ) {
    const row =
      worksheet.addRow([
        "OWNER",

        toExcelBusinessDate(
          expense.occurredAt,
        ),

        null,
        null,

        expense.categoryLabel,

        "Pengeluaran Owner",

        null,
        null,

        toExcelMoney(
          expense.amount,
        ),

        "",
        "",

        expense.description,
      ]);

    row.getCell(2).numFmt =
      DATE_FORMAT;

    row.getCell(9).numFmt =
      MONEY_FORMAT;
  }

  for (
    const expense
    of data.operationExpenses
  ) {
    const row =
      worksheet.addRow([
        "OPERASIONAL",

        toExcelBusinessDate(
          expense.occurredAt,
        ),

        null,
        null,

        expense.categoryLabel,

        "Daily Report",

        null,
        null,

        toExcelMoney(
          expense.amount,
        ),

        expense.kandangName,
        expense.operatorName,

        expense.description ??
          "",
      ]);

    row.getCell(2).numFmt =
      DATE_FORMAT;

    row.getCell(9).numFmt =
      MONEY_FORMAT;
  }

  worksheet.eachRow(
    {
      includeEmpty: false,
    },
    (
      row,
      rowNumber,
    ) => {
      if (rowNumber === 1) {
        return;
      }

      row.getCell(
        12,
      ).alignment = {
        wrapText: true,
        vertical: "top",
      };
    },
  );
}

function buildStockSheet(
  workbook: Workbook,
  data: ReportExportData,
): void {
  const worksheet =
    workbook.addWorksheet(
      "Stok",
      {
        views: [
          {
            showGridLines:
              false,
          },
        ],
      },
    );

  setColumnWidths(
    worksheet,
    [
      30,
      20,
      18,
    ],
  );

  worksheet.mergeCells(
    "A1:C1",
  );

  worksheet.getCell(
    "A1",
  ).value =
    `Stok per ${formatPeriodDate(
      data.summary.inventory
        .asOfDate,
    )}`;

  worksheet.getCell(
    "A1",
  ).font = {
    bold: true,
    size: 15,
    color: {
      argb: BRAND_GREEN,
    },
  };

  applySectionTitle(
    worksheet,
    3,
    "Telur",
    3,
  );

  worksheet.getCell(
    "A4",
  ).value =
    "Tanggal As-Of";

  setDateCell(
    worksheet.getCell(
      "B4",
    ),
    data.summary.inventory
      .asOfDate,
  );

  worksheet.getCell(
    "A5",
  ).value =
    "Stok Telur (kg)";

  setQuantityCell(
    worksheet.getCell(
      "B5",
    ),
    data.summary.inventory
      .eggStockKg,
  );

  worksheet.getCell(
    "A6",
  ).value =
    "Status";

  worksheet.getCell(
    "B6",
  ).value =
    data.summary.inventory
      .eggStockNegative
      ? "Negatif"
      : "Normal";

  applySectionTitle(
    worksheet,
    8,
    "Pakan",
    3,
  );

  const headerRow =
    worksheet.getRow(
      9,
    );

  headerRow.values = [
    "Bahan",
    "Stok (kg)",
    "Status",
  ];

  applyHeaderStyle(
    headerRow,
  );

  let rowNumber =
    10;

  for (
    const ingredient
    of data.summary.inventory
      .feedStocks
  ) {
    worksheet.getCell(
      rowNumber,
      1,
    ).value =
      ingredient.ingredientName;

    setQuantityCell(
      worksheet.getCell(
        rowNumber,
        2,
      ),
      ingredient.stockKg,
    );

    worksheet.getCell(
      rowNumber,
      3,
    ).value =
      ingredient.isNegative
        ? "Negatif"
        : "Normal";

    rowNumber +=
      1;
  }
}

export async function buildReportWorkbook(
  data: ReportExportData,
): Promise<Buffer> {
  const workbook =
    new Workbook();

  workbook.creator =
    "UdinFarm";

  workbook.lastModifiedBy =
    "UdinFarm";

  workbook.title =
    "Laporan UdinFarm";

  workbook.subject =
    "Operational Farm Report";

  workbook.company =
    "UdinFarm";

  buildSummarySheet(
    workbook,
    data,
  );

  buildProductionSheet(
    workbook,
    data,
  );

  buildSalesSheet(
    workbook,
    data,
  );

  buildCostsSheet(
    workbook,
    data,
  );

  buildStockSheet(
    workbook,
    data,
  );

  /*
   * writeBuffer() result dikembalikan langsung.
   * Tidak dibuat Uint8Array/ArrayBuffer copy kedua.
   */
  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}