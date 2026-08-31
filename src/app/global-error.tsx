"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-[#F9FAFB] font-sans antialiased text-foreground">
        <main className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-danger">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Kesalahan Kritis Sistem
            </h1>

            <p className="mt-2 text-sm text-muted">
              Terjadi kendala pada inisialisasi aplikasi. Silakan muat ulang halaman.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => reset()}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Muat Ulang
              </Button>

              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-[#F9FAFB] sm:w-auto"
              >
                Ke Halaman Login
              </Link>
            </div>
          </Card>
        </main>
      </body>
    </html>
  );
}
