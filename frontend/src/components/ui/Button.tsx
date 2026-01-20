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
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    ghost: "border border-slate-200 text-slate-700 hover:bg-slate-100",
  };
  const classes = [base, variants[variant], className].filter(Boolean).join(" ");

  return <button className={classes} {...props} />;
}
