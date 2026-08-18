"use client";

import {
  type ReactNode,
  useState,
} from "react";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  Boxes,
  ClipboardCheck,
  Egg,
  FileSpreadsheet,
  Home,
  LayoutDashboard,
  MoreHorizontal,
  Receipt,
  ShoppingCart,
  User,
  Warehouse,
  Wallet,
  Wheat,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  LogoutButton,
} from "@/features/auth/components/logout-button";

import type {
  AuthUser,
} from "@/features/auth/types/auth";

type OwnerShellProps = {
  children: ReactNode;
  user: AuthUser;
};

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
};

type NavigationGroup = {
  title?: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] =
  [
    {
      items: [
        {
          label:
            "Dashboard",
          icon:
            LayoutDashboard,
          href:
            "/dashboard",
        },
      ],
    },
    {
      title:
        "Farm",

      items: [
        {
          label:
            "Operasional",
          icon:
            ClipboardCheck,
          href:
            "/daily",
        },
        {
          label:
            "Kandang",
          icon:
            Warehouse,
          href:
            "/farm",
        },
        {
          label:
            "Produksi",
          icon:
            Egg,
          href:
            "/production",
        },
        {
          label:
            "Pakan",
          icon:
            Wheat,
          href:
            "/feed",
        },
        {
          label:
            "Stok",
          icon:
            Boxes,
          href:
            "/inventory",
        },
      ],
    },
    {
      title:
        "Bisnis",

      items: [
        {
          label:
            "Penjualan",
          icon:
            ShoppingCart,
          href:
            "/sales",
        },
        {
          label:
            "Biaya",
          icon:
            Receipt,
          href:
            "/expenses",
        },
        {
          label:
            "HPP & Profit",
          icon:
            Wallet,
        },
      ],
    },
    {
      items: [
        {
          label:
            "Laporan",
          icon:
            FileSpreadsheet,
        },
      ],
    },
  ];

function isPathActive(
  pathname: string,
  href: string,
) {
  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

function SidebarItem({
  item,
  active,
}: {
  item: NavigationItem;
  active: boolean;
}) {
  const Icon =
    item.icon;

  if (!item.href) {
    return (
      <div
        aria-disabled="true"
        title={`${item.label} belum tersedia`}
        className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-light opacity-60 md:justify-center lg:justify-start"
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />

        <span className="hidden lg:inline">
          {item.label}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={
        item.href
      }
      title={
        item.label
      }
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={[
        "flex h-10 items-center gap-3 rounded-lg px-3",
        "text-sm font-medium transition-colors",
        "md:justify-center lg:justify-start",
        active
          ? "bg-primary-soft text-primary-hover"
          : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-foreground",
      ].join(" ")}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />

      <span className="hidden lg:inline">
        {item.label}
      </span>
    </Link>
  );
}

export function OwnerShell({
  children,
  user,
}: OwnerShellProps) {
  const pathname =
    usePathname();

  const [
    moreOpen,
    setMoreOpen,
  ] = useState(
    false,
  );

  const dashboardActive =
    isPathActive(
      pathname,
      "/dashboard",
    );

  const dailyActive =
    isPathActive(
      pathname,
      "/daily",
    );

  const salesActive =
    isPathActive(
      pathname,
      "/sales",
    );

  const inventoryActive =
    isPathActive(
      pathname,
      "/inventory",
    );

  const moreSectionActive =
    isPathActive(
      pathname,
      "/farm",
    ) ||
    isPathActive(
      pathname,
      "/production",
    ) ||
    isPathActive(
      pathname,
      "/feed",
    ) ||
    isPathActive(
      pathname,
      "/expenses",
    );

  const moreItems =
    navigationGroups
      .flatMap(
        (
          group,
        ) =>
          group.items,
      )
      .filter(
        (
          item,
        ) =>
          item.label !==
            "Dashboard" &&
          item.label !==
            "Operasional" &&
          item.label !==
            "Penjualan" &&
          item.label !==
            "Stok",
      );

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-background md:flex-row">
      <aside className="sticky top-0 hidden h-screen w-[76px] shrink-0 flex-col border-r border-border bg-white md:flex lg:w-64">
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-border lg:justify-start lg:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
              U
            </div>

            <span className="hidden text-lg lg:inline">
              UdinFarm
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navigationGroups.map(
            (
              group,
              groupIndex,
            ) => (
              <div
                key={
                  groupIndex
                }
                className="space-y-1"
              >
                {group.title ? (
                  <p className="mb-1.5 hidden px-3 text-[11px] font-medium uppercase tracking-wide text-muted-light lg:block">
                    {
                      group.title
                    }
                  </p>
                ) : null}

                {group.items.map(
                  (
                    item,
                  ) => (
                    <SidebarItem
                      key={
                        item.label
                      }
                      item={
                        item
                      }
                      active={
                        item.href
                          ? isPathActive(
                              pathname,
                              item.href,
                            )
                          : false
                      }
                    />
                  ),
                )}
              </div>
            ),
          )}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex flex-col items-center gap-1 lg:flex-row lg:gap-2">
            <div className="flex min-w-0 flex-1 items-center justify-center gap-3 rounded-lg p-1.5 lg:justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]">
                <User className="h-4 w-4 text-[#4B5563]" />
              </div>

              <div className="hidden min-w-0 flex-1 lg:block">
                <p className="truncate text-sm font-medium text-foreground">
                  {
                    user.name
                  }
                </p>

                <p className="text-xs text-muted">
                  Pemilik
                </p>
              </div>
            </div>

            <LogoutButton compact />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4 md:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs text-white">
              U
            </div>

            <span>
              UdinFarm
            </span>
          </Link>

          <Badge variant="brand">
            Owner
          </Badge>
        </header>

        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-[1320px] p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-border bg-white px-2 md:hidden">
        <Link
          href="/dashboard"
          aria-current={
            dashboardActive
              ? "page"
              : undefined
          }
          className={[
            "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1",
            dashboardActive
              ? "text-primary-hover"
              : "text-muted",
          ].join(" ")}
        >
          <Home className="h-5 w-5" />

          <span className="text-[10px] font-medium">
            Home
          </span>
        </Link>

        <Link
          href="/daily"
          aria-current={
            dailyActive
              ? "page"
              : undefined
          }
          className={[
            "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1",
            dailyActive
              ? "text-primary-hover"
              : "text-muted",
          ].join(" ")}
        >
          <ClipboardCheck className="h-5 w-5" />

          <span className="text-[10px] font-medium">
            Hari Ini
          </span>
        </Link>

        <Link
          href="/sales?tab=order"
          aria-current={
            salesActive
              ? "page"
              : undefined
          }
          className={[
            "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1",
            salesActive
              ? "text-primary-hover"
              : "text-muted",
          ].join(" ")}
        >
          <ShoppingCart className="h-5 w-5" />

          <span className="text-[10px] font-medium">
            Order
          </span>
        </Link>

        <Link
          href="/inventory"
          aria-current={
            inventoryActive
              ? "page"
              : undefined
          }
          className={[
            "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1",
            inventoryActive
              ? "text-primary-hover"
              : "text-muted",
          ].join(" ")}
        >
          <Boxes className="h-5 w-5" />

          <span className="text-[10px] font-medium">
            Stok
          </span>
        </Link>

        <button
          type="button"
          aria-label="Buka menu lainnya"
          aria-expanded={
            moreOpen
          }
          onClick={() =>
            setMoreOpen(
              true,
            )
          }
          className={[
            "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1",
            moreOpen ||
            moreSectionActive
              ? "text-primary-hover"
              : "text-muted",
          ].join(" ")}
        >
          <MoreHorizontal className="h-5 w-5" />

          <span className="text-[10px]">
            Lainnya
          </span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 cursor-default bg-black/40"
            onClick={() =>
              setMoreOpen(
                false,
              )
            }
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu lainnya"
            className="safe-bottom relative w-full rounded-t-2xl bg-white p-4 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  Menu Lainnya
                </p>

                <p className="mt-0.5 truncate text-xs text-muted">
                  {
                    user.name
                  }
                </p>
              </div>

              <button
                type="button"
                aria-label="Tutup"
                onClick={() =>
                  setMoreOpen(
                    false,
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-[#F3F4F6]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map(
                (
                  item,
                ) => {
                  const Icon =
                    item.icon;

                  if (
                    item.href
                  ) {
                    const active =
                      isPathActive(
                        pathname,
                        item.href,
                      );

                    return (
                      <Link
                        key={
                          item.label
                        }
                        href={
                          item.href
                        }
                        aria-current={
                          active
                            ? "page"
                            : undefined
                        }
                        onClick={() =>
                          setMoreOpen(
                            false,
                          )
                        }
                        className={[
                          "flex min-w-0 items-center gap-3 rounded-[10px] border p-3",
                          active
                            ? "border-[#BBF7D0] bg-primary-soft text-primary-hover"
                            : "border-border bg-white text-[#4B5563]",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4 shrink-0" />

                        <span className="truncate text-sm font-medium">
                          {
                            item.label
                          }
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={
                        item.label
                      }
                      aria-disabled="true"
                      className="flex min-w-0 items-center gap-3 rounded-[10px] border border-border bg-[#F9FAFB] p-3 text-muted-light opacity-65"
                    >
                      <Icon className="h-4 w-4 shrink-0" />

                      <span className="truncate text-sm">
                        {
                          item.label
                        }
                      </span>
                    </div>
                  );
                },
              )}
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}