import type {
  HTMLAttributes,
  ReactNode,
} from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-[12px] border border-border bg-white",
        "shadow-[0_1px_2px_rgba(17,24,39,0.03)]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}