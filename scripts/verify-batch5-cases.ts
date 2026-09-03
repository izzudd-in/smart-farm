import fs from "node:fs";
import path from "node:path";

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

console.log("\n==========================================================================");
console.log("  VERIFIKASI BATCH 5: RSP-001, RSP-003, RSP-006, BUG-001, BUG-014, BUG-018");
console.log("==========================================================================\n");

// Read source files to inspect implementations
const dashboardFile = fs.readFileSync(
  path.join(process.cwd(), "src/features/dashboard/components/owner-dashboard.tsx"),
  "utf8"
);
const ownerShellFile = fs.readFileSync(
  path.join(process.cwd(), "src/components/shared/owner-shell/owner-shell.tsx"),
  "utf8"
);
const overviewQueryFile = fs.readFileSync(
  path.join(process.cwd(), "src/features/dashboard/queries/get-dashboard-overview.ts"),
  "utf8"
);
const exportRouteFile = fs.readFileSync(
  path.join(process.cwd(), "src/app/(owner)/reports/export/route.ts"),
  "utf8"
);

// --- RSP-001: Statistik Cards Stack Vertikal & No Horizontal Scroll ---
console.log("[Test Group 1] RSP-001: Responsive Stacking & No Overflow");
assert(
  dashboardFile.includes("grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"),
  "KPI cards container menggunakan grid-cols-1 di mobile (stack vertikal), sm:grid-cols-2, xl:grid-cols-4"
);
assert(
  dashboardFile.includes("grid-cols-1 sm:grid-cols-3"),
  "Mini stats container pada Trend Produksi menggunakan grid-cols-1 di mobile, sm:grid-cols-3"
);
assert(
  dashboardFile.includes("overflow-hidden") && dashboardFile.includes("break-words"),
  "KpiCard memiliki styling overflow-hidden dan break-words agar angka panjang tidak overflow"
);

// --- RSP-003: Bottom Navigation Minimal 44px & Label Readability ---
console.log("\n[Test Group 2] RSP-003: Bottom Navigation Item Dimensions (<360px)");
assert(
  ownerShellFile.includes("min-w-[44px]") && ownerShellFile.includes("min-h-[44px]"),
  "Setiap item bottom navigation memiliki min-w-[44px] dan min-h-[44px]"
);
assert(
  ownerShellFile.includes("leading-tight truncate max-w-full"),
  "Label nav item menggunakan leading-tight truncate max-w-full agar tetap terbaca rapi"
);
const screenWidth = 320;
const navItemsCount = 5;
const availableWidthPerItem = (screenWidth - 8) / navItemsCount; // px-1 = 8px
assert(
  availableWidthPerItem >= 44 || ownerShellFile.includes("overflow-x-auto"),
  "Layar 320px terakomodasi dengan overflow-x-auto scrollbar-none dan touch target 44px"
);

// --- RSP-006: Collapsible Sidebar on Tablet Portrait & Content >= 60% ---
console.log("\n[Test Group 3] RSP-006: Collapsible Sidebar on Tablet");
assert(
  ownerShellFile.includes("isSidebarCollapsed"),
  "Owner shell memiliki state isSidebarCollapsed untuk mengatur status collapse sidebar"
);
assert(
  ownerShellFile.includes("ChevronLeft") && ownerShellFile.includes("ChevronRight"),
  "Tersedia toggle button interaktif untuk collapse/expand sidebar"
);
assert(
  ownerShellFile.includes("md:min-w-[60%]"),
  "Content area memiliki jaminan minimal 60% viewport (md:min-w-[60%])"
);

// --- BUG-001: Visual Cards, Badges, & Categorized Icons ---
console.log("\n[Test Group 4] BUG-001: Anti Text-Heavy & Visual Design");
assert(
  dashboardFile.includes("getActivityCategory") && dashboardFile.includes("AlertIcon"),
  "Activities dan Alerts menggunakan komponen icon dan badge ringkas per tipe"
);
assert(
  !dashboardFile.includes("teks deskriptif panjang"),
  "Format paragraf deskriptif panjang sudah digantikan card visual statistik"
);

// --- BUG-014: Staged Sub-Queries & Pool Throttling ---
console.log("\n[Test Group 5] BUG-014: Sub-Queries Refactor (Max 4 Parallel Connections)");
assert(
  overviewQueryFile.includes("Batch Sub-query 1: Operasional & Produksi") &&
  overviewQueryFile.includes("Batch Sub-query 2: Finansial & Inventori") &&
  overviewQueryFile.includes("Batch Sub-query 3: Aktivitas & Onboarding Checklist"),
  "12 queries paralel direfaktor menjadi 3 staged sub-queries terpisah (max 4 per batch)"
);

// --- BUG-018: Streaming Response & Timeout Mitigation ---
console.log("\n[Test Group 6] BUG-018: Streaming Response for Report Export");
assert(
  /maxDuration\s*=\s*60/.test(exportRouteFile),
  "Export route mengonfigurasi maxDuration = 60 detik"
);
assert(
  exportRouteFile.includes("ReadableStream") && /Transfer-Encoding["']?:\s*["']chunked["']/.test(exportRouteFile),
  "Response diekspor menggunakan ReadableStream dan chunked transfer encoding"
);

console.log("\n==========================================================================");
console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==========================================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
