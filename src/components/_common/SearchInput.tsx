import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function SearchInput({ className = "", ...rest }: Props) {
  return (
    <input
      className={[
        "w-full rounded-xl border bg-white px-4 py-3 text-sm",
        "outline-none transition",
        "focus:ring-2 focus:ring-brand-primary/30",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
