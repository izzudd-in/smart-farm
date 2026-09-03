"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error in Dashboard page:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2] text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h2 className="text-lg font-bold text-foreground">
          Gagal Memuat Dashboard
        </h2>

        <p className="mt-2 text-xs text-muted">
          {error.message ||
            "Terjadi kesalahan saat memproses metrik dan analitik dashboard. Silakan muat ulang halaman."}
        </p>

        <div className="mt-5 flex justify-center">
          <Button onClick={() => reset()} size="sm" className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Coba Lagi
          </Button>
        </div>
      </Card>
    </div>
  );
}
