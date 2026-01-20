"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLocationSearch } from "../hooks/useLocationSearch";

export function LocationSearch() {
  const { query, setQuery, results, loading, error, runSearch } =
    useLocationSearch();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runSearch();
  };

  return (
    <aside className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Search
      </p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">
        건물명으로 위치 찾기
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        건물명을 입력하면 위치 정보가 바로 표시됩니다.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <Input
          placeholder="예: 홍명기홀"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "검색 중..." : "검색하기"}
        </Button>
      </form>
      <div className="mt-5 space-y-2">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {results.length === 0 ? (
          <p className="text-sm text-slate-400">검색 결과가 아직 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((location) => (
              <li
                key={location.id}
                className="rounded-2xl border border-black/10 bg-[rgba(17,16,18,0.02)] p-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {location.name}
                </p>
                <p className="text-xs text-slate-600">{location.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
