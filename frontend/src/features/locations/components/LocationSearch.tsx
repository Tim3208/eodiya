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
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Search</h2>
      <p className="mt-1 text-sm text-slate-600">
        Look up campus locations by building name.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <Input
          placeholder="Enter building name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>
      <div className="mt-5 space-y-2">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {results.length === 0 ? (
          <p className="text-sm text-slate-400">No results yet.</p>
        ) : (
          <ul className="space-y-2">
            {results.map((location) => (
              <li
                key={location.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
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
