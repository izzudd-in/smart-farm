import type { ReactNode } from "react";

type BadgeVariant =
  | "brand"
  | "neutral"
  | "success"
  | "warning"
  | "danger";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  brand:
    "border-[#BBF7D0] bg-primary-soft text-[#15803D]",
  neutral:
    "border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]",
  success:
    "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
  warning:
    "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  danger:
    "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border",
        "px-2.5 py-1 text-[11px] font-medium",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}