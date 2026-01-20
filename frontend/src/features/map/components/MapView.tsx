export function MapView() {
  return (
    <section className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[32px] border border-black/10 bg-white/90 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Campus Map
          </p>
          <h2 className="mt-2 font-display text-2xl text-slate-900">
            Map preview
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            지도 API를 연결하면 실시간 위치 핀이 표시됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Live
        </div>
      </div>
      <div className="relative mt-6 flex flex-1 items-center justify-center rounded-3xl border border-dashed border-black/10 bg-grid text-sm text-slate-400">
        <div className="absolute left-[18%] top-[30%] h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_rgba(242,92,47,0.2)]" />
        <div className="absolute right-[22%] top-[45%] h-3 w-3 rounded-full bg-slate-900 shadow-[0_0_0_6px_rgba(17,16,18,0.15)]" />
        <div className="absolute bottom-[28%] left-[45%] h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]" />
        <span className="rounded-full bg-white/80 px-4 py-2 text-xs">
          Map canvas
        </span>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {["홍명기홀", "학생회관", "도서관", "요한관"].map((label) => (
          <span
            key={label}
            className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-slate-500"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
