import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getRoleHome } from "@/features/auth/routes";
import { getCurrentUser } from "@/server/auth/current-user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getRoleHome(user.role));
  }

  return <LoginForm />;
}