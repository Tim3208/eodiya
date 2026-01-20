export function MapView() {
  return (
    <section className="flex min-h-[420px] flex-col justify-between rounded-3xl border border-dashed border-slate-300 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Map</h2>
        <p className="mt-1 text-sm text-slate-600">
          Map placeholder. Replace with a real map provider.
        </p>
      </div>
      <div className="mt-6 flex flex-1 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
        Map canvas
      </div>
    </section>
  );
}
