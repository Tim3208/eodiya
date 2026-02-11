type Props = { x: number; y: number; label?: string };

export default function Pin({ x, y, label }: Props) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full select-none"
      style={{ left: x, top: y }}
      title={label}
    >
      <div className="flex flex-col items-center gap-1">
        {label ? (
          <div className="rounded-full bg-brand-primary px-2 py-1 text-xs font-semibold text-white shadow">
            {label}
          </div>
        ) : null}
        <div className="h-4 w-4 rotate-45 bg-red-500 shadow" />
      </div>
    </div>
  );
}
