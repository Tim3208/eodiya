import { getApiBaseUrl } from "@/lib/config/env";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export async function apiGet<T>(path: string, query?: QueryParams): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.replace(/^\//, "");
  const url = new URL(cleanPath, baseUrl);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}
