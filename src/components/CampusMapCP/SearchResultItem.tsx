import type { PlaceSearchResult } from "../../lib/search";

export default function SearchResultItem({ result }: { result: PlaceSearchResult }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <div className="text-sm font-semibold text-gray-900">{result.title}</div>
      <div className="text-xs text-gray-600">{result.subtitle}</div>
    </div>
  );
}
