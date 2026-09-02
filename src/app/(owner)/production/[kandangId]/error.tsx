"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProductionKandangDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error in Production Kandang Detail page:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2] text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h2 className="text-lg font-bold text-foreground">
          Gagal Memuat Detail Produksi Kandang
        </h2>

        <p className="mt-2 text-xs text-muted">
          Terjadi kesalahan saat memproses data detail kandang. Silakan coba kembali.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button onClick={() => reset()} size="sm" className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Coba Lagi
          </Button>

          <Link
            href="/production"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-[#F9FAFB]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Produksi
          </Link>
        </div>
      </Card>
    </div>
  );
}
