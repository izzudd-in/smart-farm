import type {
  ProductionPeriodMode,
  ProductionReportRow,
  ProductionTrendPoint,
  TrendComparisonPoint,
} from "@/features/production/types/production";
import { parseDateOnly } from "@/features/daily-operations/utils/date";
import {
  getDaysAgo,
  getStartOfMonth,
  getStartOfWeek,
  getYesterday,
} from "@/features/production/utils/dates";

export function deriveEggProduction(
  saleableEgg: number | null,
  damagedEgg: number | null,
): {
  totalEgg: number | null;
  damagedPercentage: number | null;
} {
  if (
    saleableEgg === null ||
    damagedEgg === null
  ) {
    return {
      totalEgg: null,
      damagedPercentage: null,
    };
  }

  const totalEgg =
    saleableEgg + damagedEgg;

  return {
    totalEgg,

    damagedPercentage:
      totalEgg === 0
        ? 0
        : (damagedEgg / totalEgg) *
          100,
  };
}

export function sumNullable(
  values: Array<
    number | null | undefined
  >,
): number | null {
  const validValues = values.filter(
    (value): value is number =>
      value !== null &&
      value !== undefined,
  );

  if (validValues.length === 0) {
    return null;
  }

  return validValues.reduce(
    (total, value) =>
      total + value,
    0,
  );
}

export function calculateEstimatedPopulation(
  initialPopulation: number,
  cumulativeMortality: number,
): number {
  return Math.max(
    0,
    initialPopulation -
      cumulativeMortality,
  );
}

export function calculateDamagedPercentage(
  saleableEgg: number | null,
  damagedEgg: number | null,
): number | null {
  return deriveEggProduction(
    saleableEgg,
    damagedEgg,
  ).damagedPercentage;
}

/**
 * FCR = Total Pakan (kg) / Total Produksi Telur (kg)
 */
export function calculateFcr(
  feedUsed: number | null | undefined,
  totalEgg: number | null | undefined,
): number | null {
  if (
    feedUsed === null ||
    feedUsed === undefined ||
    totalEgg === null ||
    totalEgg === undefined ||
    totalEgg <= 0
  ) {
    return null;
  }

  const fcr = feedUsed / totalEgg;
  return Number(fcr.toFixed(2));
}

/**
 * Hen-Day Production (%) = (Jumlah Butir Telur / (Ayam Aktif * Jumlah Hari)) * 100%
 * Konversi standar industri layer: 1 kg telur ≈ 16 butir telur.
 */
export function calculateHenDay(
  totalEggKg: number | null | undefined,
  activePopulation: number | null | undefined,
  daysCount = 1,
): number | null {
  if (
    totalEggKg === null ||
    totalEggKg === undefined ||
    activePopulation === null ||
    activePopulation === undefined ||
    activePopulation <= 0 ||
    daysCount <= 0
  ) {
    return null;
  }

  const estimatedEggs = totalEggKg * 16;
  const potentialEggs = activePopulation * daysCount;

  const hd = (estimatedEggs / potentialEggs) * 100;
  return Number(hd.toFixed(1));
}

/**
 * Persentase Perubahan: ((periode aktif - periode sebelumnya) / periode sebelumnya) * 100%
 */
export function calculatePercentageChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    previous === 0
  ) {
    return null;
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  return Number(change.toFixed(1));
}

export function calculateMortalityRate(
  mortality: number | null | undefined,
  population: number | null | undefined,
): number | null {
  if (
    mortality === null ||
    mortality === undefined ||
    population === null ||
    population === undefined ||
    population <= 0
  ) {
    return null;
  }

  return Number(((mortality / population) * 100).toFixed(2));
}

/**
 * Menghitung rentang tanggal periode sebelumnya yang sesuai dengan mode analisa
 */
export function getPreviousPeriod(
  from: string,
  to: string,
  mode: ProductionPeriodMode = "custom",
): { from: string; to: string; daysCount: number } {
  if (mode === "today") {
    const yesterday = getYesterday(to);
    return {
      from: yesterday,
      to: yesterday,
      daysCount: 1,
    };
  }

  if (mode === "weekly") {
    // Current week start (Senin)
    const curStart = getStartOfWeek(to);
    const prevStart = getDaysAgo(7, curStart);
    const prevEnd = getDaysAgo(1, curStart); // Minggu minggu lalu
    return {
      from: prevStart,
      to: prevEnd,
      daysCount: 7,
    };
  }

  if (mode === "monthly") {
    const curStart = getStartOfMonth(to);
    const curD = parseDateOnly(curStart);
    // Awal bulan lalu
    const prevD = new Date(Date.UTC(curD.getUTCFullYear(), curD.getUTCMonth() - 1, 1));
    const prevStart = prevD.toISOString().slice(0, 10);
    // Akhir bulan lalu
    const prevEndD = new Date(Date.UTC(curD.getUTCFullYear(), curD.getUTCMonth(), 0));
    const prevEnd = prevEndD.toISOString().slice(0, 10);
    const daysCount = prevEndD.getUTCDate();
    return {
      from: prevStart,
      to: prevEnd,
      daysCount,
    };
  }

  // Custom fallback berdasarkan selisih hari
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);

  const diffMs = toDate.getTime() - fromDate.getTime();
  const daysCount = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

  const prevToDate = new Date(fromDate.getTime() - 24 * 60 * 60 * 1000);
  const prevFromDate = new Date(
    prevToDate.getTime() - (daysCount - 1) * 24 * 60 * 60 * 1000,
  );

  return {
    from: prevFromDate.toISOString().slice(0, 10),
    to: prevToDate.toISOString().slice(0, 10),
    daysCount,
  };
}

/**
 * Membangun titik perbandingan tren yang disesuaikan dengan mode analisa:
 * - Hari Ini (FT-087): membandingkan hari sebelumnya dengan hari terpilih
 * - Minggu Ini (FT-088): 7 hari sejajar (Senin s/d Minggu)
 * - Bulan Ini (FT-089): agregasi mingguan (Minggu 1 s/d 5) agar tidak terlalu padat
 * - Kustom: Day 1..N
 */
export function buildTrendComparison(params: {
  mode: ProductionPeriodMode;
  fromDate: Date;
  toDate: Date;
  prevFromDate: Date;
  prevToDate: Date;
  currentHistory: ProductionReportRow[];
  previousHistory: ProductionReportRow[];
}): TrendComparisonPoint[] {
  const {
    mode,
    fromDate,
    toDate,
    prevFromDate,
    currentHistory,
    previousHistory,
  } = params;

  // Map total produksi per tanggal
  const curDateMap = new Map<string, number>();
  for (const row of currentHistory) {
    const prev = curDateMap.get(row.date) ?? 0;
    curDateMap.set(row.date, prev + (row.totalEgg ?? 0));
  }

  const prevDateMap = new Map<string, number>();
  for (const row of previousHistory) {
    const prev = prevDateMap.get(row.date) ?? 0;
    prevDateMap.set(row.date, prev + (row.totalEgg ?? 0));
  }

  // FT-087: Mode Hari Ini (Line chart membandingkan hari sebelumnya dengan hari terpilih)
  if (mode === "today") {
    const curDateStr = toDate.toISOString().slice(0, 10);
    const prevDateStr = prevFromDate.toISOString().slice(0, 10);

    const prevVal = prevDateMap.get(prevDateStr) ?? null;
    const curVal = curDateMap.get(curDateStr) ?? null;

    return [
      {
        dayIndex: 1,
        dayLabel: "Kemarin",
        currentDate: prevDateStr,
        currentValue: prevVal,
        previousDate: prevDateStr,
        previousValue: prevVal,
      },
      {
        dayIndex: 2,
        dayLabel: "Hari Ini",
        currentDate: curDateStr,
        currentValue: curVal,
        previousDate: prevDateStr,
        previousValue: prevVal,
      },
    ];
  }

  // FT-088: Mode Minggu Ini (7 hari sejajar: Senin s/d Minggu)
  if (mode === "weekly") {
    const dayNames = [
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
      "Minggu",
    ];
    const points: TrendComparisonPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const curD = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000);
      const prevD = new Date(prevFromDate.getTime() + i * 24 * 60 * 60 * 1000);

      const curDateStr = curD.toISOString().slice(0, 10);
      const prevDateStr = prevD.toISOString().slice(0, 10);

      points.push({
        dayIndex: i + 1,
        dayLabel: dayNames[i] ?? `Hari ${i + 1}`,
        currentDate: curDateStr,
        currentValue: curDateMap.get(curDateStr) ?? null,
        previousDate: prevDateStr,
        previousValue: prevDateMap.get(prevDateStr) ?? null,
      });
    }

    return points;
  }

  // FT-089: Mode Bulan Ini (Agregasi mingguan agar grafik tidak terlalu padat)
  if (mode === "monthly") {
    const weeks = [
      { label: "Minggu 1 (Tgl 1-7)", startDay: 1, endDay: 7 },
      { label: "Minggu 2 (Tgl 8-14)", startDay: 8, endDay: 14 },
      { label: "Minggu 3 (Tgl 15-21)", startDay: 15, endDay: 21 },
      { label: "Minggu 4 (Tgl 22-28)", startDay: 22, endDay: 28 },
      { label: "Minggu 5 (Tgl 29+)", startDay: 29, endDay: 31 },
    ];

    const curYear = fromDate.getUTCFullYear();
    const curMonth = fromDate.getUTCMonth();
    const prevYear = prevFromDate.getUTCFullYear();
    const prevMonth = prevFromDate.getUTCMonth();

    return weeks.map((week, idx) => {
      // Sum for current month week
      let curSum: number | null = null;
      let hasCur = false;
      for (let d = week.startDay; d <= week.endDay; d++) {
        const dObj = new Date(Date.UTC(curYear, curMonth, d));
        if (dObj.getUTCMonth() === curMonth) {
          const dStr = dObj.toISOString().slice(0, 10);
          if (curDateMap.has(dStr)) {
            hasCur = true;
            curSum = (curSum ?? 0) + (curDateMap.get(dStr) ?? 0);
          }
        }
      }

      // Sum for previous month week
      let prevSum: number | null = null;
      let hasPrev = false;
      for (let d = week.startDay; d <= week.endDay; d++) {
        const dObj = new Date(Date.UTC(prevYear, prevMonth, d));
        if (dObj.getUTCMonth() === prevMonth) {
          const dStr = dObj.toISOString().slice(0, 10);
          if (prevDateMap.has(dStr)) {
            hasPrev = true;
            prevSum = (prevSum ?? 0) + (prevDateMap.get(dStr) ?? 0);
          }
        }
      }

      const curWeekStartDate = new Date(Date.UTC(curYear, curMonth, week.startDay))
        .toISOString()
        .slice(0, 10);
      const prevWeekStartDate = new Date(Date.UTC(prevYear, prevMonth, week.startDay))
        .toISOString()
        .slice(0, 10);

      return {
        dayIndex: idx + 1,
        dayLabel: week.label,
        currentDate: curWeekStartDate,
        currentValue: hasCur && curSum !== null ? Number(curSum.toFixed(2)) : null,
        previousDate: prevWeekStartDate,
        previousValue: hasPrev && prevSum !== null ? Number(prevSum.toFixed(2)) : null,
      };
    });
  }

  // Custom mode: Day 1..N
  const diffMs = toDate.getTime() - fromDate.getTime();
  const daysCount = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
  const points: TrendComparisonPoint[] = [];

  for (let i = 0; i < daysCount; i++) {
    const curD = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000);
    const prevD = new Date(prevFromDate.getTime() + i * 24 * 60 * 60 * 1000);

    const curDateStr = curD.toISOString().slice(0, 10);
    const prevDateStr = prevD.toISOString().slice(0, 10);

    points.push({
      dayIndex: i + 1,
      dayLabel: `Hari ${i + 1}`,
      currentDate: curDateStr,
      currentValue: curDateMap.get(curDateStr) ?? null,
      previousDate: prevDateStr,
      previousValue: prevDateMap.get(prevDateStr) ?? null,
    });
  }

  return points;
}

export function buildProductionTrend(
  rows: ProductionReportRow[],
): ProductionTrendPoint[] {
  const groups = new Map<
    string,
    ProductionReportRow[]
  >();

  for (const row of rows) {
    const current =
      groups.get(row.date) ?? [];

    current.push(row);

    groups.set(row.date, current);
  }

  return Array.from(groups.entries())
    .sort(([dateA], [dateB]) =>
      dateA.localeCompare(dateB),
    )
    .map(([date, reports]) => {
      const totalProduction = sumNullable(
        reports.map((report) => report.totalEgg),
      );

      const saleableEgg = sumNullable(
        reports.map((report) => report.saleableEgg),
      );

      const damagedEgg = sumNullable(
        reports.map((report) => report.damagedEgg),
      );

      const feedUsed = sumNullable(
        reports.map((report) => report.feedUsed),
      );

      const mortality = sumNullable(
        reports.map((report) => report.mortality),
      );

      const activePop = sumNullable(
        reports.map((report) => report.estimatedPopulation),
      );

      const fcr = calculateFcr(feedUsed, totalProduction);
      const henDay = calculateHenDay(totalProduction, activePop, 1);

      return {
        date,
        totalProduction,
        saleableEgg,
        damagedEgg,
        feedUsed,
        mortality,
        fcr,
        henDay,
      };
    });
}