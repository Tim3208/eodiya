import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  const base =
    "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--accent)] focus:outline-none";
  const classes = [base, className].filter(Boolean).join(" ");

  return <input className={classes} {...props} />;
}
