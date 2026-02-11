import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost";
    size?: "sm" | "md";
  }
>;

export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-50";

  const sizes = size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-3 text-sm";

  const variants =
    variant === "primary"
      ? "bg-brand-primary text-brand-onPrimary hover:bg-brand-primaryHover"
      : "bg-transparent text-brand-primary hover:bg-brand-primary/10";

  return (
    <button className={`${base} ${sizes} ${variants} ${className}`} {...rest}>
      {children}
    </button>
  );
}
