import { apiGet } from "@/lib/api/client";
import type { Location } from "../types";

export async function searchLocations(name: string) {
  return apiGet<Location[]>("locations", { name });
}
