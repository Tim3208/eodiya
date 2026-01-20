import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition";
  const variants = {
    primary:
      "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] shadow-sm",
    ghost:
      "border border-black/10 text-slate-700 hover:bg-black/[0.04]",
  };
  const classes = [base, variants[variant], className].filter(Boolean).join(" ");

  return <button className={classes} {...props} />;
}
