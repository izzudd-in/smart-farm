"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  History,
  User,
} from "lucide-react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import type { AuthUser } from "@/features/auth/types/auth";

type OperatorShellProps = {
  children: ReactNode;
  user: AuthUser;
};

function isPathActive(
  pathname: string,
  href: string,
) {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export function OperatorShell({
  children,
  user,
}: OperatorShellProps) {
  const pathname = usePathname();

  const todayActive =
    isPathActive(
      pathname,
      "/operator/today",
    );

  const historyActive =
    isPathActive(
      pathname,
      "/operator/history",
    );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background pb-24">
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-white">
        <div className="mx-auto flex h-full w-full max-w-lg items-center justify-between gap-3 px-4">
          <Link
            href="/operator/today"
            className="flex shrink-0 items-center gap-2 font-bold text-foreground"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs text-white">
              U
            </div>

            <span>UdinFarm</span>
          </Link>

          <div className="flex min-w-0 items-center gap-1">
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <User className="h-4 w-4 shrink-0 text-muted" />

              <span className="max-w-32 truncate text-sm font-medium text-[#4B5563]">
                {user.name}
              </span>
            </div>

            <LogoutButton compact />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col p-4">
        {children}
      </main>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 mx-auto flex h-16 w-full max-w-lg border-t border-border bg-white px-2">
        <Link
          href="/operator/today"
          aria-current={
            todayActive
              ? "page"
              : undefined
          }
          className={[
            "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1",
            todayActive
              ? "text-primary-hover"
              : "text-muted",
          ].join(" ")}
        >
          <CalendarCheck className="h-5 w-5" />

          <span className="text-[10px] font-medium">
            Hari Ini
          </span>
        </Link>

        <Link
          href="/operator/history"
          aria-current={
            historyActive
              ? "page"
              : undefined
          }
          className={[
            "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1",
            historyActive
              ? "text-primary-hover"
              : "text-muted",
          ].join(" ")}
        >
          <History className="h-5 w-5" />

          <span className="text-[10px] font-medium">
            Riwayat
          </span>
        </Link>

        <div
          aria-disabled="true"
          title="Profil belum tersedia"
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-muted-light opacity-55"
        >
          <User className="h-5 w-5" />

          <span className="text-[10px]">
            Profil
          </span>
        </div>
      </nav>
    </div>
  );
}