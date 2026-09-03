import { parseReportFilters } from "../src/features/reports/schemas/report-filter";
import {
  calculateDamageRatePercent,
  calculateSnapshotFeedUsageMilliKg,
  reportMilliKgToQuantity,
} from "../src/features/reports/utils/report-calculation";
import { getJakartaTodayString } from "../src/features/daily-operations/utils/date";

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
console.log("  FT-064: LIHAT RINGKASAN LAPORAN TEST");
console.log("==========================================\n");

// 1. Filter Schema & Presets
console.log("[Test Group 1] Report Filter Schema & Presets");
const today = getJakartaTodayString();

const todayFilter = parseReportFilters({ preset: "today" });
assert(todayFilter.from === today && todayFilter.to === today, "Preset 'today' sets from and to as today");
assert(todayFilter.preset === "today", "Preset is 'today'");

const weekFilter = parseReportFilters({ preset: "7d" });
assert(weekFilter.to === today, "Preset '7d' to date is today");
assert(weekFilter.preset === "7d", "Preset is '7d'");

const monthFilter = parseReportFilters({ preset: "this-month" });
assert(monthFilter.preset === "this-month", "Preset is 'this-month'");
assert(monthFilter.from.endsWith("-01"), "Month preset starts on 1st of month");

// 2. Date Swapping & Edge Cases
console.log("\n[Test Group 2] Filter Edge Cases & Validation");
const inverted = parseReportFilters({ from: "2026-08-30", to: "2026-08-01" });
assert(inverted.from === "2026-08-01" && inverted.to === "2026-08-30", "Swaps inverted from and to dates");

const invalidDates = parseReportFilters({ from: "invalid-date", to: "bad-date" });
assert(invalidDates.from.length === 10 && invalidDates.to.length === 10, "Fallback to default month range for invalid dates");

// 3. Calculation Utilities
console.log("\n[Test Group 3] Report Calculations");
const damageRate = calculateDamageRatePercent("100.000", "2.500");
assert(damageRate === "2.44", `Damage rate percent is 2.44% (actual: ${damageRate}%)`);

const damageZero = calculateDamageRatePercent("0.000", "0.000");
assert(damageZero === null, "Damage rate with zero total egg returns null");

const feedUsage = calculateSnapshotFeedUsageMilliKg(100, "50.00");
const feedKg = reportMilliKgToQuantity(feedUsage);
assert(feedKg === "50.000", `Feed usage calculated accurately (50.000 kg, actual: ${feedKg})`);

console.log("\n==========================================");
console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
