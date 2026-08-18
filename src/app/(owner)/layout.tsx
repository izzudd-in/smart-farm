import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { OwnerShell } from "@/components/shared/owner-shell/owner-shell";
import {
  AUTH_ROUTES,
  getRoleHome,
} from "@/features/auth/routes";
import { UserRole } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/server/auth/current-user";

type OwnerLayoutProps = {
  children: ReactNode;
};

export default async function OwnerLayout({
  children,
}: OwnerLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(AUTH_ROUTES.login);
  }

  if (user.role !== UserRole.OWNER) {
    redirect(getRoleHome(user.role));
  }

  return (
    <OwnerShell user={user}>
      {children}
    </OwnerShell>
  );
}