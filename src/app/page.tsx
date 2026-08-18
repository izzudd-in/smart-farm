import { redirect } from "next/navigation";

import {
  AUTH_ROUTES,
  getRoleHome,
} from "@/features/auth/routes";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(AUTH_ROUTES.login);
  }

  redirect(getRoleHome(user.role));
}