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
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Egg,
  FileSpreadsheet,
  LayoutDashboard,
  MoreHorizontal,
  Receipt,
  Settings,
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

const navigationGroups: NavigationGroup[] = [
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

        href:
          "/hpp",
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

        href:
          "/reports",
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
  collapsed = false,
}: {
  item: NavigationItem;
  active: boolean;
  collapsed?: boolean;
}) {
  const Icon =
    item.icon;

  if (!item.href) {
    return (
      <div
        aria-disabled="true"
        title={`${item.label} belum tersedia`}
        className={[
          "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-light opacity-60",
          collapsed ? "justify-center" : "md:justify-center lg:justify-start",
        ].join(" ")}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />

        <span className={collapsed ? "hidden" : "hidden lg:inline"}>
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
        collapsed ? "justify-center" : "md:justify-center lg:justify-start",
        active
          ? "bg-primary-soft text-primary-hover"
          : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-foreground",
      ].join(
        " ",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />

      <span className={collapsed ? "hidden" : "hidden lg:inline"}>
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

  const [
    isSidebarCollapsed,
    setIsSidebarCollapsed,
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

  const settingsActive =
    isPathActive(
      pathname,
      "/settings",
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
    ) ||
    isPathActive(
      pathname,
      "/hpp",
    ) ||
    isPathActive(
      pathname,
      "/reports",
    ) ||
    settingsActive;

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
      <aside
        className={[
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-white transition-all duration-200 md:flex",
          isSidebarCollapsed ? "w-[72px]" : "w-[72px] lg:w-64",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-3 lg:px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 overflow-hidden font-bold text-foreground"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
              U
            </div>

            <span
              className={[
                "text-lg truncate",
                isSidebarCollapsed ? "hidden" : "hidden lg:inline",
              ].join(" ")}
            >
              UdinFarm
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={
              isSidebarCollapsed
                ? "Perbesar sidebar"
                : "Kecilkan sidebar"
            }
            className="hidden h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-[#F3F4F6] hover:text-foreground md:flex"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
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
                  <p
                    className={[
                      "mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-light",
                      isSidebarCollapsed
                        ? "hidden"
                        : "hidden lg:block",
                    ].join(" ")}
                  >
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
                      collapsed={
                        isSidebarCollapsed
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
            <Link
              href="/settings"
              title="Pengaturan Akun"
              aria-current={
                settingsActive
                  ? "page"
                  : undefined
              }
              className={[
                "flex w-full min-w-0 flex-1 items-center justify-center gap-3 rounded-lg p-1.5 transition-colors",
                isSidebarCollapsed
                  ? "justify-center"
                  : "lg:justify-start",
                settingsActive
                  ? "bg-primary-soft text-primary-hover"
                  : "hover:bg-[#F3F4F6]",
              ].join(
                " ",
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]">
                <User className="h-4 w-4 text-[#4B5563]" />
              </div>

              <div
                className={[
                  "min-w-0 flex-1",
                  isSidebarCollapsed
                    ? "hidden"
                    : "hidden lg:block",
                ].join(" ")}
              >
                <p className="truncate text-sm font-medium text-foreground">
                  {
                    user.name
                  }
                </p>

                <p className="text-xs text-muted">
                  Pengaturan akun
                </p>
              </div>
            </Link>

            <LogoutButton
              compact
            />
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

        <main className="min-w-0 flex-1 pb-24 md:pb-0 w-full md:min-w-[60%]">
          <div className="mx-auto w-full max-w-[1320px] p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-white px-1 overflow-x-auto scrollbar-none md:hidden">
        <Link
          href="/dashboard"
          aria-current={
            dashboardActive
              ? "page"
              : undefined
          }
          className={[
            "flex h-full min-w-[44px] min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-center touch-manipulation transition-colors select-none",
            dashboardActive
              ? "text-primary-hover font-semibold"
              : "text-muted",
          ].join(
            " ",
          )}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />

          <span className="text-[10px] font-medium leading-tight truncate max-w-full tracking-tight">
            Dashboard
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
            "flex h-full min-w-[44px] min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-center touch-manipulation transition-colors select-none",
            dailyActive
              ? "text-primary-hover font-semibold"
              : "text-muted",
          ].join(
            " ",
          )}
        >
          <ClipboardCheck className="h-5 w-5 shrink-0" />

          <span className="text-[10px] font-medium leading-tight truncate max-w-full tracking-tight">
            Operasional
          </span>
        </Link>

        <Link
          href="/sales"
          aria-current={
            salesActive
              ? "page"
              : undefined
          }
          className={[
            "flex h-full min-w-[44px] min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-center touch-manipulation transition-colors select-none",
            salesActive
              ? "text-primary-hover font-semibold"
              : "text-muted",
          ].join(
            " ",
          )}
        >
          <ShoppingCart className="h-5 w-5 shrink-0" />

          <span className="text-[10px] font-medium leading-tight truncate max-w-full tracking-tight">
            Penjualan
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
            "flex h-full min-w-[44px] min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-center touch-manipulation transition-colors select-none",
            inventoryActive
              ? "text-primary-hover font-semibold"
              : "text-muted",
          ].join(
            " ",
          )}
        >
          <Boxes className="h-5 w-5 shrink-0" />

          <span className="text-[10px] font-medium leading-tight truncate max-w-full tracking-tight">
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
            "flex h-full min-w-[44px] min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-center touch-manipulation transition-colors select-none",
            moreOpen ||
            moreSectionActive
              ? "text-primary-hover font-semibold"
              : "text-muted",
          ].join(
            " ",
          )}
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" />

          <span className="text-[10px] font-medium leading-tight truncate max-w-full tracking-tight">
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
                        ].join(
                          " ",
                        )}
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

            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <Link
                href="/settings"
                aria-current={
                  settingsActive
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
                  settingsActive
                    ? "border-[#BBF7D0] bg-primary-soft text-primary-hover"
                    : "border-border bg-white text-[#4B5563]",
                ].join(
                  " ",
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    Pengaturan Akun
                  </p>

                  <p className="mt-0.5 truncate text-xs text-muted">
                    Profil dan keamanan
                  </p>
                </div>
              </Link>

              <LogoutButton />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}