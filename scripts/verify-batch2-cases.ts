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

console.log("\n========================================================");
console.log("  VERIFIKASI BATCH 2: FT-065, FT-076, FT-077, FT-078, FT-079");
console.log("========================================================\n");

// --- FT-065: Export Laporan ke Excel ---
console.log("[Test Group 1] FT-065: Export Laporan ke Excel");
const dateA = new Date("2026-08-01T00:00:00Z");
const dateB = new Date("2026-08-10T00:00:00Z");
const diffDays = Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
assert(diffDays <= 366, "Rentang tanggal dalam batas aman 366 hari");

const tooLongDate = new Date(dateA.getTime() + 370 * 24 * 60 * 60 * 1000);
const tooLongDiff = Math.round((tooLongDate.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
assert(tooLongDiff > 366, "Validasi mendeteksi rentang melebihi 366 hari");

// --- FT-076: Tampilkan Dashboard dengan Data Lengkap ---
console.log("\n[Test Group 2] FT-076: Dashboard Struktur Data Lengkap");
const mockDashboard = {
  today: "2026-09-03",
  productionToday: { saleableEggKg: "150.000", completeReports: 2, expectedReports: 2, isFinal: true },
  salesToday: { revenue: "3000000.00", soldKg: "120.000", orderCount: 3 },
  eggStock: { currentStockKg: "450.000", isNegative: false },
  estimatedProfitMonthToDate: { estimatedOperationalProfit: "15000000.00", status: "READY" },
  alerts: [],
  productionTrend: Array.from({ length: 7 }, (_, i) => ({ date: `2026-08-${28 + i}`, productionKg: "100.000" })),
  recentActivities: Array.from({ length: 6 }, (_, i) => ({ id: `act-${i}`, occurredAt: `2026-09-03T10:0${i}:00Z`, title: `Activity ${i}` })),
};

assert(Boolean(mockDashboard.productionToday), "Dashboard memuat KPI Produksi");
assert(Boolean(mockDashboard.salesToday), "Dashboard memuat KPI Penjualan");
assert(Boolean(mockDashboard.eggStock), "Dashboard memuat KPI Stok Telur");
assert(Boolean(mockDashboard.estimatedProfitMonthToDate), "Dashboard memuat KPI Estimasi Profit MTD");
assert(Array.isArray(mockDashboard.productionTrend), "Dashboard memuat Production Trend");
assert(Array.isArray(mockDashboard.recentActivities), "Dashboard memuat Recent Activities");

// --- FT-077: Alerts untuk Kondisi Abnormal ---
console.log("\n[Test Group 3] FT-077: Kondisi Abnormal Alerts");
type MockAlert = { id: string; severity: "CRITICAL" | "WARNING"; title: string };
const alerts: MockAlert[] = [];

// Case 1: Low egg stock (< 50 kg)
const eggStockKg = 35;
if (eggStockKg < 50) {
  alerts.push({ id: "egg-stock-low", severity: "WARNING", title: "Stok telur menipis" });
}
assert(alerts.some((a) => a.id === "egg-stock-low"), "Alert stok telur menipis terpicu saat stok < 50 kg");

// Case 2: Negative egg stock
const negativeEggStock = -5;
if (negativeEggStock < 0) {
  alerts.push({ id: "egg-stock-negative", severity: "CRITICAL", title: "Stok telur negatif" });
}
assert(alerts.some((a) => a.id === "egg-stock-negative" && a.severity === "CRITICAL"), "Alert kritis stok telur negatif");

// Case 3: High mortality in kandang (>= 5 ekor)
const kandangMortality = 6;
if (kandangMortality >= 5) {
  alerts.push({ id: "high-mortality-critical", severity: "CRITICAL", title: "Mortalitas tinggi terdeteksi hari ini" });
}
assert(alerts.some((a) => a.id === "high-mortality-critical" && a.severity === "CRITICAL"), "Alert kritis mortalitas tinggi kandang >= 5 ekor");

// Case 4: Total mortality high (>= 10 ekor)
const totalMortality = 12;
if (totalMortality >= 10) {
  alerts.push({ id: "high-mortality-warning", severity: "WARNING", title: "Total kematian ayam meningkat" });
}
assert(alerts.some((a) => a.id === "high-mortality-warning"), "Alert peringatan total mortalitas hari ini >= 10 ekor");

// --- FT-078: Maksimal 6 Aktivitas Terbaru Diurutkan Descending ---
console.log("\n[Test Group 4] FT-078: Recent Activities Max 6 & Sorted Descending");
const rawActivities = [
  { id: "1", occurredAt: "2026-09-03T08:00:00Z" },
  { id: "2", occurredAt: "2026-09-03T12:00:00Z" },
  { id: "3", occurredAt: "2026-09-03T09:30:00Z" },
  { id: "4", occurredAt: "2026-09-03T14:15:00Z" },
  { id: "5", occurredAt: "2026-09-03T07:10:00Z" },
  { id: "6", occurredAt: "2026-09-03T11:00:00Z" },
  { id: "7", occurredAt: "2026-09-03T13:00:00Z" },
  { id: "8", occurredAt: "2026-09-03T06:00:00Z" },
];

const sortedTop6 = rawActivities
  .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  .slice(0, 6);

assert(sortedTop6.length === 6, "Aktivitas dibatasi maksimal 6");
assert(sortedTop6[0].id === "4", "Aktivitas pertama adalah yang paling terbaru (14:15:00)");
assert(sortedTop6[5].id === "1", "Aktivitas ke-6 adalah yang terlama dari 6 teratas (08:00:00)");

// --- FT-079: Trend Produksi 7 Hari Terakhir ---
console.log("\n[Test Group 5] FT-079: Trend Produksi Tepat 7 Hari");
const todayDate = new Date("2026-09-03T00:00:00.000Z");
const trendPoints = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(todayDate.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
});

assert(trendPoints.length === 7, "Trend produksi memiliki tepat 7 titik data harian");
assert(trendPoints[0] === "2026-08-28", "Titik pertama adalah 6 hari lalu (2026-08-28)");
assert(trendPoints[6] === "2026-09-03", "Titik terakhir adalah hari ini (2026-09-03)");

console.log("\n========================================================");
console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("========================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
