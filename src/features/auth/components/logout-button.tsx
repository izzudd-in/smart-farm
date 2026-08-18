"use client";

import {
  LoaderCircle,
  LogOut,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import { logout } from "@/features/auth/actions/logout";

type LogoutButtonProps = {
  compact?: boolean;
  className?: string;
};

function LogoutSubmitButton({
  compact,
  className,
}: LogoutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title="Keluar"
      aria-label={compact ? "Keluar" : undefined}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg",
        "text-muted transition-colors",
        "hover:bg-danger-soft hover:text-danger",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-primary/20",
        "disabled:pointer-events-none disabled:opacity-50",
        compact
          ? "h-9 w-9"
          : "h-9 px-3 text-sm",
        className ?? "",
      ].join(" ")}
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}

      {!compact ? (
        <span>
          {pending ? "Keluar..." : "Keluar"}
        </span>
      ) : null}
    </button>
  );
}

export function LogoutButton(
  props: LogoutButtonProps,
) {
  return (
    <form
      action={logout}
      className="inline-flex shrink-0"
    >
      <LogoutSubmitButton {...props} />
    </form>
  );
}