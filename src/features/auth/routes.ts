import type { UserRole } from "@/generated/prisma/enums";

export const AUTH_ROUTES = {
  login: "/login",
  ownerHome: "/dashboard",
  operatorHome: "/operator/today",
} as const;

export function getRoleHome(
  role: UserRole,
): "/dashboard" | "/operator/today" {
  return role === "OWNER"
    ? AUTH_ROUTES.ownerHome
    : AUTH_ROUTES.operatorHome;
}