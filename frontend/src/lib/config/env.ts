const DEFAULT_API_BASE_URL = "http://localhost:4000/api/";

export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!envUrl) return DEFAULT_API_BASE_URL;
  return envUrl.endsWith("/") ? envUrl : `${envUrl}/`;
}
