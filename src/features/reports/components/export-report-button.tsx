"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type ExportReportButtonProps = {
  exportHref: string;
};

export function ExportReportButton({ exportHref }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const response = await fetch(exportHref);

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(
          "Gagal mengunduh Excel",
          errorText || "Terjadi kesalahan pada server saat memproses laporan.",
        );
        return;
      }

      const disposition = response.headers.get("Content-Disposition");
      let filename = "laporan-smartfarm.xlsx";
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        "Laporan berhasil diunduh",
        `File ${filename} telah tersimpan di perangkat Anda.`,
      );
    } catch (err) {
      console.error("Export report error:", err);
      toast.error(
        "Gagal mengunduh Excel",
        "Koneksi terputus atau terjadi kesalahan jaringan saat mengunduh.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] border border-primary bg-white px-4 text-sm font-semibold text-primary-hover transition-colors hover:bg-primary-soft disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Menyiapkan Excel...</span>
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4 shrink-0" />
          <span>Export Excel</span>
        </>
      )}
    </button>
  );
}
