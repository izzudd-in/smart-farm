import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { OperatorShell } from "@/components/shared/operator-shell/operator-shell";
import {
  AUTH_ROUTES,
  getRoleHome,
} from "@/features/auth/routes";
import { UserRole } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/server/auth/current-user";

type OperatorLayoutProps = {
  children: ReactNode;
};

export default async function OperatorLayout({
  children,
}: OperatorLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(AUTH_ROUTES.login);
  }

  if (user.role !== UserRole.OPERATOR) {
    redirect(getRoleHome(user.role));
  }

  return (
    <OperatorShell user={user}>
      {children}
    </OperatorShell>
  );
}