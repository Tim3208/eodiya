import { useState } from "react";
import type { Location } from "../types";
import { searchLocations } from "../api/locations";

export function useLocationSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchLocations(query);
      setResults(data);
    } catch (err) {
      setError("Failed to load locations.");
    } finally {
      setLoading(false);
    }
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    runSearch,
  };
}
