import {
  calculateFcr,
  calculateHenDay,
  calculatePercentageChange,
  deriveEggProduction,
  getPreviousPeriod,
  buildTrendComparison,
} from "../src/features/production/utils/calculations";
import type { ProductionReportRow } from "../src/features/production/types/production";
import { parseProductionFilters } from "../src/features/production/schemas/production-filter";
import {
  getStartOfWeek,
  getYesterday,
} from "../src/features/production/utils/dates";

function mockRow(date: string, totalEgg: number): ProductionReportRow {
  return {
    id: `mock-${date}`,
    date,
    kandangId: "k-1",
    kandangCode: "K1",
    kandangName: "Kandang 1",
    flockId: "f-1",
    flockName: "Flock A",
    status: "COMPLETE",
    saleableEgg: totalEgg,
    damagedEgg: 0,
    totalEgg,
    damagedPercentage: 0,
    feedUsed: 100,
    fcr: 2.2,
    henDay: 85,
    activePopulation: 1000,
    mortality: 0,
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log("\n==========================================");
console.log("  SPRINT 7 PRODUCTION & RELEASE TEST SUITE");
console.log("==========================================\n");

// --- FT-090 & Date Utilities ---
console.log("[Test Group 1] FT-090: Default Filter Minggu Ini (Weekly)");
const defaultFilters = parseProductionFilters({});
assert(defaultFilters.mode === "weekly", "Default filter mode is 'weekly'");
assert(
  defaultFilters.from === getStartOfWeek(defaultFilters.to),
  "Default filter 'from' starts at Monday of current week",
);

// --- FT-087: Mode Hari Ini ---
console.log("\n[Test Group 2] FT-087: Mode Hari Ini");
const todayFilters = parseProductionFilters({ mode: "today" });
assert(todayFilters.mode === "today", "Filter mode is 'today'");
const prevToday = getPreviousPeriod(todayFilters.from, todayFilters.to, "today");
assert(
  prevToday.from === getYesterday(todayFilters.from) &&
    prevToday.to === getYesterday(todayFilters.to),
  "Previous period for 'today' is yesterday",
);

const trendToday = buildTrendComparison({
  mode: "today",
  fromDate: "2026-09-02",
  toDate: "2026-09-02",
  prevFromDate: "2026-09-01",
  prevToDate: "2026-09-01",
  currentHistory: [mockRow("2026-09-02", 190)],
  previousHistory: [mockRow("2026-09-01", 180)],
});
assert(trendToday.length === 2, "Mode 'today' generates 2 trend points (Kemarin vs Hari Ini)");
assert(trendToday[0].dayLabel === "Kemarin", "Point 0 is 'Kemarin'");
assert(trendToday[1].dayLabel === "Hari Ini", "Point 1 is 'Hari Ini'");

// --- FT-088: Mode Minggu Ini ---
console.log("\n[Test Group 3] FT-088: Mode Minggu Ini");
const trendWeekly = buildTrendComparison({
  mode: "weekly",
  fromDate: "2026-08-24", // Monday
  toDate: "2026-08-30",   // Sunday
  prevFromDate: "2026-08-17",
  prevToDate: "2026-08-23",
  currentHistory: [mockRow("2026-08-24", 200)],
  previousHistory: [mockRow("2026-08-17", 190)],
});
assert(trendWeekly.length === 7, "Mode 'weekly' generates 7 daily comparison points (Senin-Minggu)");
assert(trendWeekly[0].dayLabel === "Senin", "Day 1 is Senin");
assert(trendWeekly[6].dayLabel === "Minggu", "Day 7 is Minggu");

// --- FT-089: Mode Bulan Ini (Agregasi) ---
console.log("\n[Test Group 4] FT-089: Mode Bulan Ini");
const trendMonthly = buildTrendComparison({
  mode: "monthly",
  fromDate: "2026-08-01",
  toDate: "2026-08-31",
  prevFromDate: "2026-07-01",
  prevToDate: "2026-07-31",
  currentHistory: [],
  previousHistory: [],
});
assert(trendMonthly.length === 5, "Mode 'monthly' generates 5 clean aggregated weekly buckets");
assert(trendMonthly[0].dayLabel.includes("Minggu 1"), "Bucket 1 is Minggu 1 (Tgl 1-7)");
assert(trendMonthly[4].dayLabel.includes("Minggu 5"), "Bucket 5 is Minggu 5 (Tgl 29+)");

// --- DT-002: Pemisahan Satuan (kg vs butir) & Tidak Mencampur Satuan ---
console.log("\n[Test Group 5] DT-002: Satuan Telur (kg vs butir)");
const eggDerivation = deriveEggProduction(185.0, 3); // 185 kg saleable, 3 butir damaged
assert(
  eggDerivation.totalEgg === 185.0,
  "Total egg mass strictly equals saleableEgg in kg (no unit mixing with butir)",
);
assert(
  eggDerivation.damagedPercentage !== null && eggDerivation.damagedPercentage > 0,
  "Damaged percentage calculated relative to estimated total count",
);

// --- DT-016: FCR = Feed Consumption (kg) / Total Egg Mass (kg) ---
console.log("\n[Test Group 6] DT-016: FCR Formula");
// 475 kg feed used, 185 kg total egg mass -> FCR = 475 / 185 = 2.57
const fcr = calculateFcr(475, 185);
assert(fcr === 2.57, `FCR is 2.57 (actual: ${fcr})`);
const fcrZero = calculateFcr(475, 0);
assert(fcrZero === null, "FCR with zero egg mass returns null safely");

// --- FT-081: Hen-Day (%) ---
console.log("\n[Test Group 7] FT-081: Hen-Day (%) Formula");
// 185 kg egg * 16 butir/kg = 2960 butir. 3500 hens * 1 day = 3500. HD = (2960/3500)*100 = 84.6%
const hd = calculateHenDay(185, 3500, 1);
assert(hd === 84.6, `Hen-Day is 84.6% (actual: ${hd}%)`);

// --- DT-018: Validasi Perhitungan Perubahan Antar Periode ---
console.log("\n[Test Group 8] DT-018: Persentase Perubahan");
const pctGrowth = calculatePercentageChange(220, 200);
assert(pctGrowth === 10.0, "Growth: (220-200)/200 * 100 = +10.0%");
const pctDrop = calculatePercentageChange(180, 200);
assert(pctDrop === -10.0, "Drop: (180-200)/200 * 100 = -10.0%");
const pctZeroBase = calculatePercentageChange(150, 0);
assert(pctZeroBase === 100.0, "Zero baseline with current > 0 returns 100.0%");
const pctZeroToZero = calculatePercentageChange(0, 0);
assert(pctZeroToZero === 0.0, "0 to 0 returns 0.0%");

console.log("\n==========================================");
console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
