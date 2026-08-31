"use client";

import {
  type FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from "lucide-react";

import { login } from "@/features/auth/actions/login";
import { getRoleHome } from "@/features/auth/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Email dan password wajib diisi.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({
        email,
        password,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.replace(
        getRoleHome(result.user.role),
      );
    } catch {
      setError(
        "Terjadi kesalahan saat login. Silakan coba lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white shadow-sm">
            U
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            UdinFarm
          </h1>

          <p className="mt-1.5 text-sm text-muted">
            Sistem Manajemen Operasional Farm
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-[10px] border border-[#FECACA] bg-danger-soft p-3"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />

            <p className="text-sm text-danger">
              {error}
            </p>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="Masukkan email Anda"
            autoComplete="email"
            autoFocus
            value={email}
            disabled={isLoading}
            startIcon={
              <Mail className="h-4 w-4" />
            }
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />

          <Input
            id="password"
            name="password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            label="Password"
            placeholder="Masukkan password"
            autoComplete="current-password"
            value={password}
            disabled={isLoading}
            startIcon={
              <Lock className="h-4 w-4" />
            }
            endAdornment={
              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
                disabled={isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-[#F3F4F6] hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              "Masuk"
            )}
          </Button>

          <p className="text-center text-xs text-muted">
            Kendala akses atau lupa kredensial? Hubungi Administrator Farm.
          </p>
        </form>
      </Card>
    </main>
  );
}