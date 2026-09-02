import {
  getJakartaTodayString,
  parseDateOnly,
} from "@/features/daily-operations/utils/date";

export type ProductionPeriodMode = "today" | "weekly" | "monthly" | "custom";

/**
 * Mendapatkan tanggal awal minggu berjalan (Senin)
 */
export function getStartOfWeek(dateStr = getJakartaTodayString()): string {
  const d = parseDateOnly(dateStr);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diff = day === 0 ? 6 : day - 1; // Senin sebagai awal minggu
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Mendapatkan tanggal akhir minggu berjalan (Minggu)
 */
export function getEndOfWeek(dateStr = getJakartaTodayString()): string {
  const d = parseDateOnly(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? 0 : 7 - day; // Minggu sebagai akhir minggu
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Mendapatkan tanggal awal bulan berjalan (Tgl 1)
 */
export function getStartOfMonth(dateStr = getJakartaTodayString()): string {
  const d = parseDateOnly(dateStr);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

/**
 * Mendapatkan tanggal akhir bulan berjalan
 */
export function getEndOfMonth(dateStr = getJakartaTodayString()): string {
  const d = parseDateOnly(dateStr);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

/**
 * Mendapatkan tanggal kemarin (H-1)
 */
export function getYesterday(dateStr = getJakartaTodayString()): string {
  const d = parseDateOnly(dateStr);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Mendapatkan tanggal N hari yang lalu
 */
export function getDaysAgo(days: number, fromDateStr = getJakartaTodayString()): string {
  const d = parseDateOnly(fromDateStr);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Mendapatkan tanggal yang bersesuaian di bulan sebelumnya
 */
export function getSameDayPreviousMonth(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  const currentMonth = d.getUTCMonth();
  d.setUTCMonth(currentMonth - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Format nama hari Indonesia pendek (Sen, Sel, Rab, Kam, Jum, Sab, Min)
 */
export const INDONESIAN_DAY_NAMES = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
];

export function getIndonesianDayName(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  return INDONESIAN_DAY_NAMES[d.getUTCDay()] ?? "";
}
