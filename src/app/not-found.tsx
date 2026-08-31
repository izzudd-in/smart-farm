import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-2xl font-bold text-danger">
          404
        </div>

        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Halaman Tidak Ditemukan
        </h1>

        <p className="mt-2 text-sm text-muted">
          Halaman yang Anda cari tidak tersedia, telah dipindahkan, atau alamat URL salah.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-[#F9FAFB] sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Ke Halaman Login
          </Link>

          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </Card>
    </main>
  );
}
