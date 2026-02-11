import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import BuildingCard from "../components/CampusMapCP/BuildingCard";
import MapView from "../components/CampusMapCP/MapView";
import SearchResultItem from "../components/CampusMapCP/SearchResultItem";
import Button from "../components/_common/Button";
import Card from "../components/_common/Card";
import EmptyState from "../components/_common/EmptyState";
import SearchInput from "../components/_common/SearchInput";
import { campusPlaces } from "../data/places";
import AppLayout from "../layout/AppLayout";
import { searchPlaces, type PlaceSearchResult } from "../lib/search";
import type { CampusPlace, PlaceCategory } from "../lib/types";

type CategoryFilter = "전체" | PlaceCategory;

const INITIAL_SELECTED_ID =
  campusPlaces.find((place) => place.name === "홍명기홀")?.id ??
  campusPlaces[0]?.id ??
  null;

const formatLocation = (place: CampusPlace) =>
  place.floor ? `${place.building} ${place.floor}` : place.building;

const toDefaultResult = (place: CampusPlace): PlaceSearchResult => ({
  key: place.id,
  place,
  title: place.name,
  subtitle: `${formatLocation(place)} · ${place.category}`,
});

export default function CampusMapPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("전체");
  const [selectedId, setSelectedId] = useState<string | null>(
    INITIAL_SELECTED_ID,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const categoryOptions = useMemo<CategoryFilter[]>(() => {
    const uniqueCategories = Array.from(
      new Set(campusPlaces.map((place) => place.category)),
    );
    return ["전체", ...uniqueCategories];
  }, []);

  const buildingByName = useMemo(() => {
    const byName = new Map<string, CampusPlace>();
    campusPlaces.forEach((place) => {
      if (place.category !== "건물") return;
      byName.set(place.building, place);
    });
    return byName;
  }, []);

  const searchedResults = useMemo<PlaceSearchResult[]>(() => {
    if (!query.trim()) return campusPlaces.map(toDefaultResult);
    return searchPlaces(query, campusPlaces);
  }, [query]);

  const visibleResults = useMemo(() => {
    if (category === "전체") return searchedResults;
    return searchedResults.filter(
      (result) => result.place.category === category,
    );
  }, [category, searchedResults]);

  const visiblePlaces = useMemo<CampusPlace[]>(() => {
    const byId = new Map<string, CampusPlace>();

    visibleResults.forEach((result) => {
      if (!byId.has(result.place.id)) {
        byId.set(result.place.id, result.place);
      }
    });

    return Array.from(byId.values());
  }, [visibleResults]);

  const mapPlaces = useMemo(() => {
    const byId = new Map<string, CampusPlace>();

    visiblePlaces.forEach((place) => {
      if (place.category === "건물") {
        byId.set(place.id, place);
        return;
      }

      const buildingPlace = buildingByName.get(place.building);
      if (buildingPlace) {
        byId.set(buildingPlace.id, buildingPlace);
      }
    });

    return Array.from(byId.values());
  }, [buildingByName, visiblePlaces]);

  const selected = useMemo<CampusPlace | null>(() => {
    if (visiblePlaces.length === 0) return null;

    return (
      visiblePlaces.find((place) => place.id === selectedId) ?? visiblePlaces[0]
    );
  }, [selectedId, visiblePlaces]);

  const quickResults = useMemo(
    () => visibleResults.slice(0, 8),
    [visibleResults],
  );

  const selectedForMap = useMemo<CampusPlace | null>(() => {
    if (!selected) return null;
    if (selected.category === "건물") return selected;

    return (
      mapPlaces.find((place) => place.building === selected.building) ??
      buildingByName.get(selected.building) ??
      null
    );
  }, [buildingByName, mapPlaces, selected]);

  const handleSelectFromList = useCallback((result: PlaceSearchResult) => {
    setSelectedId(result.place.id);
    setQuery(result.title);
    setIsDropdownOpen(false);
  }, []);

  const handleSelectFromMap = useCallback((place: CampusPlace) => {
    setSelectedId(place.id);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (searchBoxRef.current?.contains(target)) return;
      setIsDropdownOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  return (
    <AppLayout>
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <div ref={searchBoxRef} className="relative">
            <SearchInput
              value={query}
              onChange={(event) => {
                const next = event.target.value;
                setQuery(next);
                setIsDropdownOpen(Boolean(next.trim()));
              }}
              onFocus={() => {
                if (query.trim()) {
                  setIsDropdownOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsDropdownOpen(false);
                  return;
                }

                if (event.key !== "Enter") return;
                event.preventDefault();

                if (visibleResults.length > 0) {
                  handleSelectFromList(visibleResults[0]);
                } else {
                  setIsDropdownOpen(false);
                }
              }}
              placeholder="장소명, 건물명, 내부 시설명으로 검색"
            />

            {isDropdownOpen && query.trim() && visibleResults.length > 0 ? (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow">
                {visibleResults.slice(0, 10).map((result) => (
                  <button
                    key={result.key}
                    className="block w-full text-left hover:bg-gray-50"
                    onClick={() => handleSelectFromList(result)}
                    type="button"
                  >
                    <SearchResultItem result={result} />
                  </button>
                ))}
              </div>
            ) : null}

            {isDropdownOpen && query.trim() && visibleResults.length === 0 ? (
              <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-600 shadow">
                검색 결과가 없습니다. 다른 키워드로 찾아보세요.
              </div>
            ) : null}
          </div>

          <Card>
            <div className="text-sm font-semibold text-gray-900">분류 필터</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={category === option ? "primary" : "ghost"}
                  onClick={() => setCategory(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </Card>

          {selected ? <BuildingCard place={selected} /> : <EmptyState />}

          <Card>
            <div className="text-sm font-semibold text-gray-900">
              주요 장소 ({visibleResults.length})
            </div>
            <div className="mt-2 divide-y">
              {quickResults.map((result) => {
                const isActive = selected?.id === result.place.id;

                return (
                  <button
                    key={result.key}
                    type="button"
                    onClick={() => handleSelectFromList(result)}
                    className={`block w-full py-2 text-left ${
                      isActive ? "bg-brand-primary/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <SearchResultItem result={result} />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <MapView
          places={mapPlaces}
          selected={selectedForMap}
          onSelect={handleSelectFromMap}
        />
      </div>
    </AppLayout>
  );
}
